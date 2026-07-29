// ============================================================
// Echo · Edge Function: mp-webhook
//
// Fuente de verdad del cobro. Verifica firma HMAC de Mercado
// Pago, y vuelve a consultar el pago contra la API antes de
// aplicar nada — nunca confía en el cuerpo del webhook.
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { reconciliationNeedsAttention } from "../_shared/reconciliationResult.ts";
import { verifyMercadoPagoSignature } from "../_shared/webhookSignature.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";
const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET") ?? "";
const MP_ENVIRONMENT =
  Deno.env.get("MP_ENVIRONMENT") === "production" ? "production" : "sandbox";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const ok = () => new Response("ok", { status: 200 });
  if (req.method !== "POST")
    return new Response("method_not_allowed", { status: 405 });

  if (
    !SUPABASE_URL ||
    !SERVICE_ROLE ||
    !MP_ACCESS_TOKEN ||
    !MP_WEBHOOK_SECRET
  ) {
    console.error("mp_webhook_configuracion_incompleta");
    return new Response("service_unavailable", { status: 503 });
  }

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const tipo = body?.type ?? url.searchParams.get("type");
    const queryDataId = url.searchParams.get("data.id");
    const dataId = String(queryDataId ?? body?.data?.id ?? "");

    if (tipo !== "payment" || !dataId) return ok();

    const signatureIsValid = await verifyMercadoPagoSignature({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId,
      secret: MP_WEBHOOK_SECRET,
    });
    if (!signatureIsValid) {
      console.error("mp_webhook_firma_invalida", { dataId });
      return new Response("firma_invalida", { status: 401 });
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${dataId}`,
      {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      },
    );
    if (!mpRes.ok) {
      console.error("mp_fetch_error", {
        status: mpRes.status,
        dataId,
      });
      return new Response("mp_fetch_error", { status: 500 });
    }
    const pago = await mpRes.json();
    const intencionId = String(pago.external_reference ?? "");

    if (!UUID_PATTERN.test(intencionId)) {
      console.error("mp_external_reference_invalida", { dataId });
      return ok();
    }
    if (pago.currency_id !== "MXN") {
      console.error("mp_moneda_invalida", {
        dataId,
        currency: pago.currency_id,
      });
      return ok();
    }
    // Do not use Mercado Pago's `live_mode` field to distinguish this
    // deployment's environment. Checkout Pro test payments can report
    // `live_mode: true` even when they were created with test credentials.
    // The configured access token determines which seller/payment can be
    // fetched, and sandbox reconciliation is isolated below so it can never
    // mutate the real resident ledger.

    const db = createClient(SUPABASE_URL, SERVICE_ROLE);
    const reconciliationFunction =
      MP_ENVIRONMENT === "sandbox"
        ? "registrar_pago_mp_prueba"
        : "aplicar_pago_mp";
    const { data, error } = await db.rpc(reconciliationFunction, {
      p_mp_payment_id: String(pago.id),
      p_intencion_id: intencionId,
      p_monto: Number(pago.transaction_amount),
      p_estado_mp: pago.status,
      p_metodo: pago.payment_method_id ?? null,
      p_payload: pago,
    });

    if (error) {
      console.error("aplicar_pago_mp_error", {
        code: error.code,
        dataId,
      });
      return new Response("db_error", { status: 500 });
    }

    if (reconciliationNeedsAttention(data)) {
      console.error("mp_reconciliation_attention_required", {
        paymentId: String(pago.id),
        intencionId,
        status: pago.status,
        reason: data.error,
        sandbox: MP_ENVIRONMENT === "sandbox",
      });
    }

    console.log("mp_webhook_procesado", {
      paymentId: String(pago.id),
      intencionId,
      status: pago.status,
      applied: data?.aplicado === true,
      sandbox: MP_ENVIRONMENT === "sandbox",
    });
    return ok();
  } catch (err) {
    console.error("mp_webhook_error", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return new Response("error", { status: 500 });
  }
});
