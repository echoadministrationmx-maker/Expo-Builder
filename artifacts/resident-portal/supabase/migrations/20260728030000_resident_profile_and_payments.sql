begin;

alter table public.perfiles
  add column if not exists whatsapp text;

alter table public.residentes
  add column if not exists whatsapp text;

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
    'email', coalesce(pf.email, ''),
    'email_verificado', pf.email_verificado,
    'telefono', coalesce(pf.telefono, ''),
    'whatsapp', coalesce(pf.whatsapp, '')
  )
  into v_profile
  from public.perfiles pf
  where pf.id = v_uid;

  if v_profile is null then
    raise exception using
      errcode = 'P0002',
      message = 'perfil_no_encontrado';
  end if;

  return v_profile;
end;
$function$;

create or replace function public.actualizar_contacto_residente(
  p_email text,
  p_telefono text,
  p_whatsapp text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_telefono text := nullif(regexp_replace(trim(coalesce(p_telefono, '')), '[^0-9+]', '', 'g'), '');
  v_whatsapp text := nullif(regexp_replace(trim(coalesce(p_whatsapp, '')), '[^0-9+]', '', 'g'), '');
  v_id_residente_legacy integer;
begin
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'no_autenticado';
  end if;

  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception using
      errcode = '22023',
      message = 'email_invalido';
  end if;

  if v_telefono is not null and v_telefono !~ '^\+?[0-9]{10,15}$' then
    raise exception using
      errcode = '22023',
      message = 'telefono_invalido';
  end if;

  if v_whatsapp is not null and v_whatsapp !~ '^\+?[0-9]{10,15}$' then
    raise exception using
      errcode = '22023',
      message = 'whatsapp_invalido';
  end if;

  if exists (
    select 1
    from public.perfiles pf
    where pf.id <> v_uid
      and pf.email_verificado
      and lower(pf.email) = v_email
  ) then
    raise exception using
      errcode = '23505',
      message = 'email_ya_registrado';
  end if;

  update public.perfiles pf
  set
    email_verificado = case
      when lower(coalesce(pf.email, '')) = v_email then pf.email_verificado
      else false
    end,
    email = v_email,
    telefono = v_telefono,
    whatsapp = v_whatsapp,
    updated_at = now()
  where pf.id = v_uid
  returning pf.id_residente_legacy into v_id_residente_legacy;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'perfil_no_encontrado';
  end if;

  if v_id_residente_legacy is not null then
    update public.residentes
    set
      email = v_email,
      telefono = v_telefono,
      whatsapp = v_whatsapp
    where id_residente = v_id_residente_legacy;
  end if;

  return public.obtener_perfil_residente();
end;
$function$;

revoke all on function public.obtener_perfil_residente() from public, anon;
revoke all on function public.actualizar_contacto_residente(text, text, text) from public, anon;
grant execute on function public.obtener_perfil_residente() to authenticated;
grant execute on function public.actualizar_contacto_residente(text, text, text) to authenticated;

-- Residents may read their RLS-scoped profile but must use narrow functions for
-- mutations. This prevents changing identity-linking and authorization columns.
revoke insert, update, delete, truncate, references, trigger
  on table public.perfiles
  from authenticated;
grant select on table public.perfiles to authenticated;

comment on function public.obtener_perfil_residente()
  is 'Returns the authenticated resident contact profile and first active unit.';

comment on function public.actualizar_contacto_residente(text, text, text)
  is 'Updates only the authenticated resident contact fields and mirrors legacy contact data.';

commit;
