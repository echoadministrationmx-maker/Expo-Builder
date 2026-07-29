# Project knowledge

- Manzana 80 supports a verified BBVA bank-transfer instruction flow. Mercado Pago Checkout Pro is
  integrated through Supabase Edge Functions and must remain labeled/configured as sandbox until
  its full payment and webhook test matrix passes.
- A Mercado Pago checkout can receive more than one distinct approved payment. Replays of the same
  payment ID are idempotent, but a second payment ID must be quarantined for investigation/refund
  and must never be interpreted as another successful ledger application.
