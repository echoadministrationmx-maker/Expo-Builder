begin;

alter table public.mp_intenciones
  add column if not exists checkout_url text,
  add column if not exists sandbox_checkout_url text,
  add column if not exists expires_at timestamptz,
  add column if not exists last_error text;

alter table public.mp_intenciones
  drop constraint if exists mp_intenciones_estado_check;

alter table public.mp_intenciones
  add constraint mp_intenciones_estado_check
  check (
    estado = any (
      array[
        'creada'::text,
        'pendiente'::text,
        'pagada'::text,
        'fallida'::text,
        'expirada'::text,
        'reembolsada'::text
      ]
    )
  );

update public.mp_intenciones
set
  estado = 'expirada',
  updated_at = now()
where estado = 'creada'
  and coalesce(expires_at, created_at + interval '30 minutes') <= now();

create unique index if not exists mp_intenciones_un_checkout_activo
  on public.mp_intenciones (perfil_id)
  where estado in ('creada', 'pendiente');

create or replace function public.crear_intencion_pago()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_adeudo record;
  v_condo bigint;
  v_actual public.mp_intenciones%rowtype;
  v_id uuid;
  v_expires_at timestamptz := now() + interval '30 minutes';
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'no_autenticado');
  end if;

  -- Serialize checkout creation per resident so two fast taps cannot create
  -- two payable preferences for the same debt.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select * into v_adeudo from public.calcular_adeudo();

  if v_adeudo.total <= 0 or v_adeudo.cantidad = 0 then
    return jsonb_build_object('ok', false, 'error', 'sin_adeudo');
  end if;

  select min(u.condominio_id)
  into v_condo
  from public.unidades u
  where u.id = any (app.mis_unidades());

  if v_condo is null then
    return jsonb_build_object('ok', false, 'error', 'sin_condominio');
  end if;

  update public.mp_intenciones
  set
    estado = 'expirada',
    updated_at = now()
  where perfil_id = v_uid
    and estado = 'creada'
    and coalesce(expires_at, created_at + interval '30 minutes') <= now();

  select *
  into v_actual
  from public.mp_intenciones
  where perfil_id = v_uid
    and estado in ('creada', 'pendiente')
  order by created_at desc
  limit 1
  for update;

  if found then
    if v_actual.pago_ids = v_adeudo.pago_ids::bigint[]
      and v_actual.monto_esperado = v_adeudo.total then
      return jsonb_build_object(
        'ok', true,
        'reutilizada', true,
        'intencion_id', v_actual.id,
        'total', v_actual.monto_esperado,
        'periodos', cardinality(v_actual.pago_ids),
        'preference_id', v_actual.preference_id,
        'checkout_url', v_actual.checkout_url,
        'sandbox_checkout_url', v_actual.sandbox_checkout_url,
        'expires_at', v_actual.expires_at
      );
    end if;

    if v_actual.estado = 'pendiente' then
      return jsonb_build_object('ok', false, 'error', 'pago_en_proceso');
    end if;

    update public.mp_intenciones
    set
      estado = 'expirada',
      updated_at = now()
    where id = v_actual.id;
  end if;

  insert into public.mp_intenciones (
    perfil_id,
    condominio_id,
    pago_ids,
    monto_esperado,
    expires_at
  )
  values (
    v_uid,
    v_condo,
    v_adeudo.pago_ids::bigint[],
    v_adeudo.total,
    v_expires_at
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'reutilizada', false,
    'intencion_id', v_id,
    'total', v_adeudo.total,
    'periodos', v_adeudo.cantidad,
    'expires_at', v_expires_at
  );
end;
$function$;

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
  v_aplicados integer[];
  v_estado text := lower(coalesce(p_estado_mp, ''));
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
    'pagos', coalesce(v_aplicados, '{}'::integer[])
  );
end;
$function$;

revoke all on function public.crear_intencion_pago() from public, anon;
grant execute on function public.crear_intencion_pago() to authenticated, service_role;

revoke all on function public.calcular_adeudo() from public, anon;
grant execute on function public.calcular_adeudo() to authenticated, service_role;

revoke all on function public.validar_residente_jwt() from public, anon;
grant execute on function public.validar_residente_jwt() to authenticated, service_role;

revoke all on function public.aplicar_pago_mp(text, uuid, numeric, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.aplicar_pago_mp(text, uuid, numeric, text, text, jsonb)
  to service_role;

revoke insert, update, delete, truncate, references, trigger
  on table public.mp_intenciones
  from public, anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.mp_transacciones
  from public, anon, authenticated;
grant select on table public.mp_intenciones, public.mp_transacciones
  to authenticated;

comment on function public.crear_intencion_pago()
  is 'Creates or safely reuses one active Mercado Pago checkout for the authenticated resident debt.';

comment on function public.aplicar_pago_mp(text, uuid, numeric, text, text, jsonb)
  is 'Service-role-only idempotent reconciliation for verified Mercado Pago payment webhooks.';

commit;
