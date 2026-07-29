// ============================================================
// Echo · Edge Function: crear-preferencia
//
// Requiere JWT válido (el residente ya inició sesión en la app).
// El monto NUNCA lo manda el cliente: se calcula en Postgres
// vía crear_intencion_pago(), que a su vez llama a
// calcular_adeudo() sobre los pagos reales de sus unidades.
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkoutReturnUrls } from "../_shared/paymentReturn.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";
const MP_ENVIRONMENT =
  Deno.env.get("MP_ENVIRONMENT") === "production" ? "production" : "sandbox";
const PUBLIC_BASE_URL =
  Deno.env.get("PUBLIC_BASE_URL") ?? "https://www.echoadministration.com";
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/mp-webhook`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY || !MP_ACCESS_TOKEN) {
    console.error("crear_preferencia_configuracion_incompleta");
    return json({ error: "servicio_no_configurado" }, 503);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "sin_sesion" }, 401);

  const dbUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const dbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const body = await req.json().catch(() => ({}));
    const backUrls = checkoutReturnUrls(body?.return_url, {
      publicBaseUrl: PUBLIC_BASE_URL,
      environment: MP_ENVIRONMENT,
    });

    const { data: perfil, error: perfilError } = await dbUser
      .rpc("validar_residente_jwt")
      .single();
    if (perfilError || !perfil) {
      return json({ error: "sesion_invalida" }, 401);
    }

    const { data: intento, error: eInt } = await dbUser.rpc(
      "crear_intencion_pago",
    );
    if (eInt) throw eInt;
    if (!intento?.ok) {
      return json(
        { error: intento?.error ?? "no_se_pudo_crear_intencion" },
        409,
      );
    }

    const reusableCheckoutUrl =
      MP_ENVIRONMENT === "sandbox"
        ? intento.sandbox_checkout_url
        : intento.checkout_url;

    if (intento.reutilizada && reusableCheckoutUrl) {
      return json({
        intencion_id: intento.intencion_id,
        checkout_url: reusableCheckoutUrl,
        environment: MP_ENVIRONMENT,
        total: intento.total,
        periodos: intento.periodos,
        expires_at: intento.expires_at,
        reused: true,
      });
    }

    const mpRes = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": intento.intencion_id,
        },
        body: JSON.stringify({
          items: [
            {
              id: intento.intencion_id,
              title: `Cuotas de mantenimiento`,
              description: `${intento.periodos} periodo(s) pendiente(s)`,
              quantity: 1,
              currency_id: "MXN",
              unit_price: intento.total,
            },
          ],
          payer: { name: (perfil as any)?.nombre ?? "" },
          external_reference: intento.intencion_id,
          metadata: { intencion_id: intento.intencion_id },
          notification_url: WEBHOOK_URL,
          statement_descriptor: "MANZANA80 ADMIN",
          back_urls: backUrls,
          auto_return: "approved",
          expires: true,
          expiration_date_to:
            intento.expires_at ??
            new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
      },
    );

    const pref = await mpRes.json();

    if (!mpRes.ok) {
      await dbAdmin
        .from("mp_intenciones")
        .update({
          estado: "fallida",
          last_error: String(pref?.message ?? `http_${mpRes.status}`).slice(
            0,
            500,
          ),
        })
        .eq("id", intento.intencion_id);
      console.error("mercadopago_preference_error", {
        status: mpRes.status,
        intencionId: intento.intencion_id,
        message: String(pref?.message ?? "unknown").slice(0, 160),
      });
      return json({ error: "mercadopago_no_disponible" }, 502);
    }

    const checkoutUrl =
      MP_ENVIRONMENT === "sandbox" ? pref.sandbox_init_point : pref.init_point;
    if (!pref.id || !checkoutUrl) {
      console.error("mercadopago_preference_incompleta", {
        intencionId: intento.intencion_id,
      });
      return json({ error: "respuesta_mercadopago_invalida" }, 502);
    }

    const { error: updateError } = await dbAdmin
      .from("mp_intenciones")
      .update({
        preference_id: pref.id,
        checkout_url: pref.init_point ?? null,
        sandbox_checkout_url: pref.sandbox_init_point ?? null,
        expires_at: intento.expires_at,
        last_error: null,
      })
      .eq("id", intento.intencion_id);
    if (updateError) throw updateError;

    return json({
      intencion_id: intento.intencion_id,
      checkout_url: checkoutUrl,
      environment: MP_ENVIRONMENT,
      total: intento.total,
      periodos: intento.periodos,
      expires_at: intento.expires_at,
      reused: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    if (
      message === "return_url_invalida" ||
      message === "return_url_no_permitida"
    ) {
      return json({ error: message }, 400);
    }

    console.error("crear_preferencia_error", { message });
    return json({ error: "error_interno" }, 500);
  }
});
