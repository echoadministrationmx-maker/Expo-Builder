# Architectural decisions

## 2026-07-28 — Resident profile and contact API

- Keep resident login bound to the synthetic Supabase Auth email resolved from the access key.
- Treat `perfiles.email`, `perfiles.telefono`, and `perfiles.whatsapp` as editable contact data.
- Add new JWT-only profile RPCs instead of changing the return type of `validar_residente_jwt` or
  reusing the legacy password-bearing `login_residente` RPC.
- Allow authenticated residents to read their RLS-scoped profile, but require narrow
  `SECURITY DEFINER` functions for contact mutations so identity-linking fields cannot be changed.
- Keep the RPC contract additive for Version 1; breaking changes require a new function name.

## 2026-07-28 — Mercado Pago Checkout Pro

- Reuse the web portal's `mp_intenciones`, `mp_transacciones`, `crear-preferencia`, and
  `mp-webhook` contract so mobile and web reconcile the same resident ledger.
- Calculate pending payment IDs and totals exclusively in Postgres from `auth.uid()`; never accept
  an amount or resident ID from a client.
- Keep the Mercado Pago Access Token and webhook secret only in Supabase Edge Function secrets.
- Permit only one active checkout per resident and reuse its preference for retries to reduce the
  risk of duplicate charges.
- Treat the signed webhook plus a server-to-server payment lookup as the source of truth. Return
  URLs are navigation hints and never mark a payment paid.
- Use Checkout Pro in the system browser, with Expo Go deep links for sandbox and the registered
  `resident-portal:` scheme in production.
- Launch in Mercado Pago sandbox first. Production is enabled only after approved, rejected,
  pending, duplicate-notification, and resident-isolation tests pass.
- Record sandbox outcomes for verification but never mutate the live `pagos` ledger from a test
  transaction.

## 2026-07-28 — Echo V2 product boundary

- Build Version 2 as one multi-tenant operating system for resident, administrator/board,
  guard/front-desk, and maintenance/field workflows.
- Treat Echo's local operating team as part of the product: operational work must have ownership,
  SLA state, evidence, cost, and an auditable outcome.
- Keep shared community resources and business rules in one backend source of truth instead of
  duplicating them across mobile and web.
- Ship Version 2 incrementally behind per-community feature flags so it does not delay or destabilize
  the Version 1 App Store release.
- Require human approval for AI-assisted financial, access, safety, disciplinary, and legal actions.
