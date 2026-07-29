begin;

create or replace function public.aplicar_pago_mp(
  p_mp_payment_id text,
  p_intencion_id uuid,
  p_monto numeric,
  p_estado_mp text,
  p_metodo text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_intencion public.mp_intenciones%rowtype;
  v_transaccion public.mp_transacciones%rowtype;
  v_aplicados integer[];
  v_estado text := lower(coalesce(p_estado_mp, ''));
  v_reembolso_asociado boolean := false;
begin
  if nullif(trim(coalesce(p_mp_payment_id, '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'payment_id_invalido');
  end if;

  select *
  into v_intencion
  from public.mp_intenciones
  where id = p_intencion_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'intencion_no_encontrada');
  end if;

  select *
  into v_transaccion
  from public.mp_transacciones
  where mp_payment_id = p_mp_payment_id;

  if found and v_transaccion.intencion_id is distinct from p_intencion_id then
    return jsonb_build_object(
      'ok', false,
      'aplicado', false,
      'error', 'payment_id_en_otra_intencion'
    );
  end if;

  -- A replay of the same approved payment is a successful no-op. A distinct
  -- approved payment for an already-settled intent is real money that requires
  -- an operations/refund workflow, never another ledger application.
  if v_estado = 'approved' and v_intencion.estado = 'pagada' then
    if found and coalesce(cardinality(v_transaccion.pagos_aplicados), 0) > 0 then
      update public.mp_transacciones
      set
        monto = p_monto,
        estado_mp = v_estado,
        metodo = p_metodo,
        payload = p_payload
      where mp_payment_id = p_mp_payment_id;

      return jsonb_build_object(
        'ok', true,
        'aplicado', false,
        'motivo', 'ya_aplicado',
        'pagos', v_transaccion.pagos_aplicados
      );
    end if;

    insert into public.mp_transacciones (
      mp_payment_id,
      intencion_id,
      perfil_id,
      condominio_id,
      monto,
      estado_mp,
      metodo,
      payload,
      cfdi_estado
    )
    values (
      p_mp_payment_id,
      p_intencion_id,
      v_intencion.perfil_id,
      v_intencion.condominio_id,
      p_monto,
      'approved_duplicate',
      p_metodo,
      p_payload,
      'error'
    )
    on conflict (mp_payment_id) do update
    set
      monto = excluded.monto,
      estado_mp = excluded.estado_mp,
      metodo = excluded.metodo,
      payload = excluded.payload,
      cfdi_estado = 'error';

    update public.mp_intenciones
    set
      last_error = 'pago_duplicado:' || p_mp_payment_id,
      updated_at = now()
    where id = p_intencion_id;

    return jsonb_build_object(
      'ok', false,
      'aplicado', false,
      'error', 'pago_duplicado'
    );
  end if;

  -- Ignore stale or out-of-order non-refund events after settlement. They are
  -- retained for audit without downgrading the paid intent.
  if v_intencion.estado = 'pagada'
    and v_estado not in ('refunded', 'charged_back')
  then
    insert into public.mp_transacciones (
      mp_payment_id,
      intencion_id,
      perfil_id,
      condominio_id,
      monto,
      estado_mp,
      metodo,
      payload,
      cfdi_estado
    )
    values (
      p_mp_payment_id,
      p_intencion_id,
      v_intencion.perfil_id,
      v_intencion.condominio_id,
      p_monto,
      v_estado,
      p_metodo,
      p_payload,
      'no_aplica'
    )
    on conflict (mp_payment_id) do update
    set
      monto = excluded.monto,
      estado_mp = excluded.estado_mp,
      metodo = excluded.metodo,
      payload = excluded.payload;

    return jsonb_build_object(
      'ok', true,
      'aplicado', false,
      'motivo', 'intencion_ya_pagada'
    );
  end if;

  if abs(p_monto - v_intencion.monto_esperado) > 0.01 then
    insert into public.mp_transacciones (
      mp_payment_id,
      intencion_id,
      perfil_id,
      condominio_id,
      monto,
      estado_mp,
      metodo,
      payload,
      cfdi_estado
    )
    values (
      p_mp_payment_id,
      p_intencion_id,
      v_intencion.perfil_id,
      v_intencion.condominio_id,
      p_monto,
      'monto_discrepante',
      p_metodo,
      p_payload,
      'error'
    )
    on conflict (mp_payment_id) do update
    set
      estado_mp = excluded.estado_mp,
      metodo = excluded.metodo,
      payload = excluded.payload;

    update public.mp_intenciones
    set
      last_error = 'monto_discrepante',
      updated_at = now()
    where id = p_intencion_id;

    return jsonb_build_object(
      'ok', false,
      'aplicado', false,
      'error', 'monto_discrepante',
      'esperado', v_intencion.monto_esperado,
      'recibido', p_monto
    );
  end if;

  insert into public.mp_transacciones (
    mp_payment_id,
    intencion_id,
    perfil_id,
    condominio_id,
    monto,
    estado_mp,
    metodo,
    payload,
    cfdi_estado
  )
  values (
    p_mp_payment_id,
    p_intencion_id,
    v_intencion.perfil_id,
    v_intencion.condominio_id,
    p_monto,
    v_estado,
    p_metodo,
    p_payload,
    case
      when v_estado in ('approved', 'authorized') then 'pendiente'
      else 'no_aplica'
    end
  )
  on conflict (mp_payment_id) do update
  set
    monto = excluded.monto,
    estado_mp = excluded.estado_mp,
    metodo = excluded.metodo,
    payload = excluded.payload;

  if v_estado in ('pending', 'in_process', 'in_mediation', 'authorized') then
    update public.mp_intenciones
    set
      estado = 'pendiente',
      last_error = null,
      updated_at = now()
    where id = p_intencion_id;

    return jsonb_build_object(
      'ok', true,
      'aplicado', false,
      'motivo', v_estado
    );
  end if;

  if v_estado in ('refunded', 'charged_back') then
    select
      exists (
        select 1
        from public.pagos
        where id_pago = any (v_intencion.pago_ids::integer[])
          and mp_payment_id = p_mp_payment_id
      )
      or (
        v_transaccion.mp_payment_id is not null
        and coalesce(cardinality(v_transaccion.pagos_aplicados), 0) > 0
      )
    into v_reembolso_asociado;

    if not v_reembolso_asociado then
      update public.mp_transacciones
      set
        estado_mp = 'refund_unmatched',
        cfdi_estado = 'error'
      where mp_payment_id = p_mp_payment_id;

      update public.mp_intenciones
      set
        last_error = 'reembolso_no_asociado:' || p_mp_payment_id,
        updated_at = now()
      where id = p_intencion_id;

      return jsonb_build_object(
        'ok', false,
        'aplicado', false,
        'error', 'reembolso_no_asociado'
      );
    end if;

    update public.pagos
    set
      estado = 'pendiente',
      fecha_pago = null,
      mp_payment_id = null,
      origen = 'manual'
    where mp_payment_id = p_mp_payment_id;

    update public.mp_intenciones
    set
      estado = 'reembolsada',
      last_error = null,
      updated_at = now()
    where id = p_intencion_id;

    return jsonb_build_object(
      'ok', true,
      'aplicado', false,
      'motivo', v_estado
    );
  end if;

  if v_estado <> 'approved' then
    update public.mp_intenciones
    set
      estado = 'fallida',
      last_error = v_estado,
      updated_at = now()
    where id = p_intencion_id;

    return jsonb_build_object(
      'ok', true,
      'aplicado', false,
      'motivo', v_estado
    );
  end if;

  update public.pagos
  set
    estado = 'pagado',
    fecha_pago = now(),
    mp_payment_id = p_mp_payment_id,
    origen = 'mercadopago'
  where id_pago = any (v_intencion.pago_ids::integer[])
    and estado = 'pendiente';

  select array_agg(id_pago order by id_pago)
  into v_aplicados
  from public.pagos
  where mp_payment_id = p_mp_payment_id;

  if coalesce(cardinality(v_aplicados), 0) = 0 then
    update public.mp_transacciones
    set
      estado_mp = 'approved_unapplied',
      cfdi_estado = 'error'
    where mp_payment_id = p_mp_payment_id;

    update public.mp_intenciones
    set
      last_error = 'approved_sin_adeudos_pendientes',
      updated_at = now()
    where id = p_intencion_id;

    return jsonb_build_object(
      'ok', false,
      'aplicado', false,
      'error', 'approved_sin_adeudos_pendientes'
    );
  end if;

  update public.mp_transacciones
  set pagos_aplicados = v_aplicados::bigint[]
  where mp_payment_id = p_mp_payment_id;

  update public.mp_intenciones
  set
    estado = 'pagada',
    last_error = null,
    updated_at = now()
  where id = p_intencion_id;

  return jsonb_build_object(
    'ok', true,
    'aplicado', true,
    'pagos', v_aplicados
  );
end;
$function$;

revoke all on function public.aplicar_pago_mp(text, uuid, numeric, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.aplicar_pago_mp(text, uuid, numeric, text, text, jsonb)
  to service_role;

alter table public.mp_intenciones enable row level security;
alter table public.mp_transacciones enable row level security;

drop policy if exists mp_intenciones_own on public.mp_intenciones;
create policy mp_intenciones_own
  on public.mp_intenciones
  for select
  to authenticated
  using (
    perfil_id = auth.uid()
    or app.es_admin(condominio_id)
  );

drop policy if exists mp_tx_sel on public.mp_transacciones;
create policy mp_tx_sel
  on public.mp_transacciones
  for select
  to authenticated
  using (
    perfil_id = auth.uid()
    or app.es_admin(condominio_id)
  );

comment on function public.aplicar_pago_mp(text, uuid, numeric, text, text, jsonb)
  is 'Service-role-only reconciliation that quarantines duplicate approvals, preserves settled intents from stale events, and validates refunds.';

commit;
