# Mercado Pago Checkout Pro API

## Scope

The Echo resident app uses Mercado Pago Checkout Pro for real-world condominium fees. Card and
payment credentials are entered only on Mercado Pago. The app and Supabase database never receive
or store card numbers.

The integration runs in `sandbox` until the full test matrix and webhook simulation pass. Moving to
production is an environment-secret change and does not change the mobile API contract.

## Create checkout

### `POST /functions/v1/crear-preferencia`

Requires the resident's Supabase bearer token. The client may supply only its validated return URL:

```json
{
  "return_url": "resident-portal:///payment-result"
}
```

Expo Go development return URLs using the `exp:` scheme are accepted only in sandbox. Production
builds use the registered `resident-portal:` application scheme. Echo's HTTPS domain is also
allowed for the web portal.

The resident, units, pending payment IDs, amount, and currency are derived server-side. The client
cannot supply an amount or another resident identifier.

Successful response:

```json
{
  "intencion_id": "uuid",
  "checkout_url": "https://sandbox.mercadopago.com/...",
  "environment": "sandbox",
  "total": 2500,
  "periodos": 2,
  "expires_at": "2026-07-28T23:30:00.000Z",
  "reused": false
}
```

Only one active checkout is allowed per resident. Repeating the operation for unchanged debt
returns the existing checkout. Stable error codes include:

- `sin_sesion` / `sesion_invalida` — HTTP 401
- `return_url_invalida` / `return_url_no_permitida` — HTTP 400
- `sin_adeudo` / `pago_en_proceso` — HTTP 409
- `mercadopago_no_disponible` — HTTP 502
- `servicio_no_configurado` — HTTP 503

## Payment webhook

### `POST /functions/v1/mp-webhook`

This public endpoint accepts Mercado Pago's `payment` webhook only. JWT verification is disabled
because Mercado Pago is the caller.

Before reconciling a payment, the function:

1. Validates `x-signature` using the application webhook secret and a five-minute replay window.
2. Fetches the payment from Mercado Pago using the private server-side Access Token.
3. Requires a valid internal intention UUID, MXN currency, and the configured sandbox/production
   mode.
4. Calls the service-role-only `aplicar_pago_mp` database function.

The webhook handles repeated notifications and status transitions idempotently. A pending payment
can later become approved; refunds and chargebacks restore the affected dues to pending.
Replays of the same approved payment are no-ops. A different approved payment for an already-paid
intent is quarantined as `approved_duplicate`, leaves the resident ledger unchanged, and emits the
structured `mp_reconciliation_attention_required` operations log for investigation/refund.

Sandbox approvals are recorded as `pagada_prueba` and never mutate `pagos`. Only a verified
production payment may mark resident dues paid.

## Authorization and secrets

- `MP_ACCESS_TOKEN` and `MP_WEBHOOK_SECRET` exist only as Supabase Edge Function secrets.
- `crear_intencion_pago`, `calcular_adeudo`, and `validar_residente_jwt` require an authenticated
  user.
- `aplicar_pago_mp` is executable only by `service_role`.
- Residents may read only their own checkout intentions and transactions through RLS.
- No private Mercado Pago or Supabase service credential may use an `EXPO_PUBLIC_` variable or be
  committed to Git.

## Versioning

This Version 1 contract is additive and shared with the web portal. Breaking response changes
require a new Edge Function slug or an explicit versioned response.
