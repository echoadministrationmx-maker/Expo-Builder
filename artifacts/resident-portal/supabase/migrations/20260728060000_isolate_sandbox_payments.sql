begin;

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
        'pagada_prueba'::text,
        'fallida'::text,
        'expirada'::text,
        'reembolsada'::text
      ]
    )
  );

create or replace function public.registrar_pago_mp_prueba(
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
  v_estado text := lower(coalesce(p_estado_mp, ''));
  v_estado_intencion text;
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
    v_estado := 'monto_discrepante';
    v_estado_intencion := v_intencion.estado;
  elsif v_estado = 'approved' then
    v_estado_intencion := 'pagada_prueba';
  elsif v_estado in ('pending', 'in_process', 'in_mediation', 'authorized') then
    v_estado_intencion := 'pendiente';
  elsif v_estado in ('refunded', 'charged_back') then
    v_estado_intencion := 'reembolsada';
  else
    v_estado_intencion := 'fallida';
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
    'no_aplica'
  )
  on conflict (mp_payment_id) do update
  set
    monto = excluded.monto,
    estado_mp = excluded.estado_mp,
    metodo = excluded.metodo,
    payload = excluded.payload,
    cfdi_estado = 'no_aplica';

  update public.mp_intenciones
  set
    estado = v_estado_intencion,
    last_error = case
      when v_estado = 'monto_discrepante' then v_estado
      else null
    end,
    updated_at = now()
  where id = p_intencion_id;

  return jsonb_build_object(
    'ok', v_estado <> 'monto_discrepante',
    'simulado', true,
    'aplicado', false,
    'estado', v_estado
  );
end;
$function$;

revoke all on function public.registrar_pago_mp_prueba(
  text,
  uuid,
  numeric,
  text,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function public.registrar_pago_mp_prueba(
  text,
  uuid,
  numeric,
  text,
  text,
  jsonb
) to service_role;

comment on function public.registrar_pago_mp_prueba(
  text,
  uuid,
  numeric,
  text,
  text,
  jsonb
) is 'Records verified Mercado Pago sandbox outcomes without mutating the resident ledger.';

commit;
