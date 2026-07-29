# Resident profile RPC

## Scope

These additive Supabase PostgREST operations are called by the Echo resident mobile app. They use
the resident's Supabase access token and derive the profile exclusively from `auth.uid()`.

## Operations

### `POST /rest/v1/rpc/obtener_perfil_residente`

Request body:

```json
{}
```

Successful response:

```json
{
  "perfil_id": "uuid",
  "nombre": "Resident name",
  "unidad": "301D2",
  "email": "resident@example.com",
  "email_verificado": true,
  "telefono": "9981234567",
  "whatsapp": "+529981234567"
}
```

Errors use the standard PostgREST error envelope. Stable database messages are
`no_autenticado` and `perfil_no_encontrado`.

### `POST /rest/v1/rpc/actualizar_contacto_residente`

Request body:

```json
{
  "p_email": "resident@example.com",
  "p_telefono": "9981234567",
  "p_whatsapp": "+529981234567"
}
```

The operation is idempotent and returns the updated profile in the same shape as
`obtener_perfil_residente`. Changing the contact email marks it unverified but does not change the
synthetic Supabase Auth email used for resident login.

Validation errors use stable messages: `email_invalido`, `telefono_invalido`,
`whatsapp_invalido`, and `email_ya_registrado`.

## Authorization

- `authenticated` may execute both functions.
- `anon` and `public` may not execute them.
- The functions are `SECURITY DEFINER`, set a fixed `search_path`, require `auth.uid()`, and never
  accept a resident/profile identifier from the client.
- Direct profile mutations are revoked from `authenticated`; residents retain RLS-scoped reads.

## Versioning

The contract is additive for Version 1. Existing legacy and JWT functions remain unchanged so web
and older mobile clients continue to operate. Any future breaking response change requires a new
function name.
