begin;

create or replace function public.obtener_encuestas_activas()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_id_residente integer;
  v_condominio bigint;
  v_encuestas jsonb;
begin
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'no_autenticado';
  end if;

  select pf.id_residente_legacy
  into v_id_residente
  from public.perfiles pf
  where pf.id = v_uid;

  if v_id_residente is null then
    raise exception using
      errcode = 'P0002',
      message = 'residente_no_vinculado';
  end if;

  select min(u.condominio_id)
  into v_condominio
  from public.unidades u
  where u.id = any (app.mis_unidades());

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', encuesta.id,
        'pregunta', encuesta.pregunta,
        'opciones', encuesta.opciones,
        'total', encuesta.total,
        'conteos', encuesta.conteos,
        'mi_voto', encuesta.mi_voto
      )
      order by encuesta.created_at desc, encuesta.id desc
    ),
    '[]'::jsonb
  )
  into v_encuestas
  from (
    select
      e.id,
      e.pregunta,
      e.opciones,
      e.created_at,
      count(v.id)::integer as total,
      coalesce(
        (
          select jsonb_object_agg(option_index::text, option_count)
          from (
            select
              ev.opcion as option_index,
              count(*)::integer as option_count
            from public.encuesta_votos ev
            where ev.encuesta_id = e.id
            group by ev.opcion
          ) counts
        ),
        '{}'::jsonb
      ) as conteos,
      max(v.opcion) filter (where v.id_residente = v_id_residente) as mi_voto
    from public.encuestas e
    left join public.encuesta_votos v on v.encuesta_id = e.id
    where e.activa
      and (e.condominio_id is null or e.condominio_id = v_condominio)
    group by e.id, e.pregunta, e.opciones, e.created_at
  ) encuesta;

  return v_encuestas;
end;
$function$;

create or replace function public.votar_encuesta_jwt(
  p_encuesta_id bigint,
  p_opcion integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_id_residente integer;
  v_condominio bigint;
  v_encuesta public.encuestas%rowtype;
  v_total integer;
  v_conteos jsonb;
begin
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'no_autenticado';
  end if;

  select pf.id_residente_legacy
  into v_id_residente
  from public.perfiles pf
  where pf.id = v_uid;

  if v_id_residente is null then
    raise exception using
      errcode = 'P0002',
      message = 'residente_no_vinculado';
  end if;

  select min(u.condominio_id)
  into v_condominio
  from public.unidades u
  where u.id = any (app.mis_unidades());

  select e.*
  into v_encuesta
  from public.encuestas e
  where e.id = p_encuesta_id
    and e.activa
    and (e.condominio_id is null or e.condominio_id = v_condominio)
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'encuesta_no_disponible';
  end if;

  if p_opcion is null
    or p_opcion < 0
    or p_opcion >= jsonb_array_length(v_encuesta.opciones) then
    raise exception using
      errcode = '22023',
      message = 'opcion_invalida';
  end if;

  insert into public.encuesta_votos (
    encuesta_id,
    id_residente,
    opcion,
    condominio_id
  )
  values (
    v_encuesta.id,
    v_id_residente,
    p_opcion,
    coalesce(v_encuesta.condominio_id, v_condominio)
  )
  on conflict (encuesta_id, id_residente)
  do update set
    opcion = excluded.opcion,
    condominio_id = excluded.condominio_id,
    created_at = now();

  select count(*)::integer
  into v_total
  from public.encuesta_votos v
  where v.encuesta_id = v_encuesta.id;

  select coalesce(jsonb_object_agg(option_index::text, option_count), '{}'::jsonb)
  into v_conteos
  from (
    select
      v.opcion as option_index,
      count(*)::integer as option_count
    from public.encuesta_votos v
    where v.encuesta_id = v_encuesta.id
    group by v.opcion
  ) counts;

  return jsonb_build_object(
    'ok', true,
    'id', v_encuesta.id,
    'total', v_total,
    'conteos', v_conteos,
    'mi_voto', p_opcion
  );
end;
$function$;

revoke all on function public.obtener_encuestas_activas() from public, anon;
revoke all on function public.votar_encuesta_jwt(bigint, integer) from public, anon;
grant execute on function public.obtener_encuestas_activas() to authenticated, service_role;
grant execute on function public.votar_encuesta_jwt(bigint, integer) to authenticated, service_role;

comment on function public.obtener_encuestas_activas()
  is 'Returns active condominium polls and aggregate results for the authenticated resident.';

comment on function public.votar_encuesta_jwt(bigint, integer)
  is 'Creates or changes the authenticated resident vote in an active condominium poll.';

commit;
