begin;

create or replace function public.obtener_perfil_residente()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_profile jsonb;
begin
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'no_autenticado';
  end if;

  select jsonb_build_object(
    'perfil_id', pf.id,
    'nombre', coalesce(pf.nombre_completo, ''),
    'unidad', coalesce((
      select coalesce(
        nullif(trim(u.identificador), ''),
        nullif(trim(u.numero), ''),
        u.id::text
      )
      from public.membresias m
      join public.unidades u on u.id = m.unidad_id
      where m.perfil_id = pf.id
        and m.activa
        and u.activa
      order by u.id
      limit 1
    ), ''),
    -- The established web portal reads contact data from residentes. Prefer
    -- that linked record until a mobile edit synchronizes both tables.
    'email', coalesce(
      nullif(trim(r.email), ''),
      nullif(trim(pf.email), ''),
      ''
    ),
    'email_verificado', (
      pf.email_verificado
      and nullif(trim(pf.email), '') is not distinct from nullif(trim(r.email), '')
    ),
    'telefono', coalesce(
      nullif(trim(r.telefono), ''),
      nullif(trim(pf.telefono), ''),
      ''
    ),
    'whatsapp', coalesce(
      nullif(trim(r.whatsapp), ''),
      nullif(trim(pf.whatsapp), ''),
      ''
    )
  )
  into v_profile
  from public.perfiles pf
  left join public.residentes r
    on r.id_residente = pf.id_residente_legacy
  where pf.id = v_uid;

  if v_profile is null then
    raise exception using
      errcode = 'P0002',
      message = 'perfil_no_encontrado';
  end if;

  return v_profile;
end;
$function$;

revoke all on function public.obtener_perfil_residente() from public, anon;
grant execute on function public.obtener_perfil_residente() to authenticated;

comment on function public.obtener_perfil_residente()
  is 'Returns the authenticated resident profile, preferring linked legacy contact data used by the web portal.';

commit;
