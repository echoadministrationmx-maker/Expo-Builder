# Supabase production security checklist

The mobile code uses Supabase Auth sessions and relies on Row Level Security for all resident data.
Read-only probes on 2026-07-28 confirmed that anonymous requests to `pagos` and `incidencias` return
HTTP 401.

## Required before App Review

- [ ] RLS is enabled on `pagos`, `incidencias`, resident profiles, and every related table.
- [ ] A signed-in resident can select only rows for their own resident/profile ID.
- [ ] A signed-in resident cannot insert or update another resident's incidents.
- [ ] `crear_solicitud_mantenimiento` derives resident/unit identity from `auth.uid()` and ignores
      client-supplied tenant identifiers.
- [ ] `validar_residente_jwt` derives identity from the JWT and exposes only required profile fields.
- [ ] No mobile-callable function is executable by `anon` unless explicitly required.
- [ ] No service-role or secret key is present in the mobile app, web bundle, Git history, or EAS
      client-visible variables.

## Identity resolver risk

`resolver_identidad` is callable before sign-in and returns the email used by Supabase Auth. If
access keys are guessable, this can enable resident email enumeration.

Preferred remediation:

1. Replace the resolver with a rate-limited server/Edge Function that accepts the resident key and
   password, performs an opaque authentication exchange, and never returns the resident email.
2. Return the same public error for unknown keys and incorrect passwords.
3. Add per-IP and per-key throttling, lockouts, monitoring, and audit logging.
4. Use high-entropy administrator-issued access keys.

Until the server implementation is available in source control, this item cannot be certified by
the mobile repository alone.

## Web portal note

The legacy web portal currently keeps the entered resident credentials in page-level JavaScript
variables and sends them again to RPC functions. Do not reproduce that design in the native app.
The native app deliberately uses Supabase Auth sessions instead.
