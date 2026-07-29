begin;

do $test$
declare
  v_source public.mp_intenciones%rowtype;
  v_intencion_id uuid := gen_random_uuid();
  v_pago_id integer := -1000000000 - floor(random() * 100000000)::integer;
  v_first_payment_id text := 'codex-integrity-first-' || gen_random_uuid()::text;
  v_duplicate_payment_id text := 'codex-integrity-duplicate-' || gen_random_uuid()::text;
  v_first_result jsonb;
  v_duplicate_result jsonb;
  v_estado_pago text;
  v_intencion_estado text;
begin
  select *
  into v_source
  from public.mp_intenciones
  order by created_at
  limit 1;

  if not found then
    raise exception 'payment integrity test requires one existing resident payment intent fixture';
  end if;

  insert into public.pagos (
    id_pago,
    monto,
    estado,
    condominio_id,
    fecha_vencimiento,
    concepto
  )
  values (
    v_pago_id,
    1250,
    'pendiente',
    v_source.condominio_id,
    '2026-07-01',
    'Codex payment integrity test'
  );

  insert into public.mp_intenciones (
    id,
    perfil_id,
    condominio_id,
    pago_ids,
    monto_esperado,
    estado
  )
  values (
    v_intencion_id,
    v_source.perfil_id,
    v_source.condominio_id,
    array[v_pago_id]::bigint[],
    1250,
    'creada'
  );

  v_first_result := public.aplicar_pago_mp(
    v_first_payment_id,
    v_intencion_id,
    1250,
    'approved',
    'account_money',
    '{"test": true}'::jsonb
  );

  if coalesce((v_first_result ->> 'aplicado')::boolean, false) is not true then
    raise exception 'first approved payment was not applied: %', v_first_result;
  end if;

  v_duplicate_result := public.aplicar_pago_mp(
    v_duplicate_payment_id,
    v_intencion_id,
    1250,
    'approved',
    'account_money',
    '{"test": true, "duplicate": true}'::jsonb
  );

  if coalesce((v_duplicate_result ->> 'aplicado')::boolean, true) is not false
    or v_duplicate_result ->> 'error' <> 'pago_duplicado'
  then
    raise exception 'second approved payment was not quarantined: %', v_duplicate_result;
  end if;

  select estado
  into v_estado_pago
  from public.pagos
  where id_pago = v_pago_id;

  select estado
  into v_intencion_estado
  from public.mp_intenciones
  where id = v_intencion_id;

  if v_estado_pago <> 'pagado' or v_intencion_estado <> 'pagada' then
    raise exception
      'duplicate payment changed settled ledger state: pago=%, intencion=%',
      v_estado_pago,
      v_intencion_estado;
  end if;
end;
$test$;

do $test$
declare
  v_missing_rls text[];
  v_missing_policies text[];
begin
  select array_agg(c.relname order by c.relname)
  into v_missing_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('mp_intenciones', 'mp_transacciones')
    and not c.relrowsecurity;

  if cardinality(v_missing_rls) > 0 then
    raise exception 'Mercado Pago tables missing RLS: %', v_missing_rls;
  end if;

  select array_agg(expected.policyname order by expected.policyname)
  into v_missing_policies
  from (
    values
      ('mp_intenciones'::text, 'mp_intenciones_own'::text),
      ('mp_transacciones'::text, 'mp_tx_sel'::text)
  ) as expected(tablename, policyname)
  where not exists (
    select 1
    from pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = expected.tablename
      and policy.policyname = expected.policyname
      and policy.cmd = 'SELECT'
      and 'authenticated' = any (policy.roles)
      and policy.qual like '%perfil_id = auth.uid()%'
  );

  if cardinality(v_missing_policies) > 0 then
    raise exception 'Mercado Pago resident policies missing: %', v_missing_policies;
  end if;
end;
$test$;

rollback;
