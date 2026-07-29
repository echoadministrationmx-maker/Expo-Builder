import assert from "node:assert/strict";
import test from "node:test";
import {
  isMercadoPagoCheckout,
  mercadoPagoErrorMessage,
} from "./mercadoPago.ts";

test("accepts the safe checkout response returned by the Edge Function", () => {
  assert.equal(
    isMercadoPagoCheckout({
      intencion_id: "0d7c3138-0125-40e8-9765-a7c850788429",
      checkout_url: "https://sandbox.mercadopago.com/checkout",
      environment: "sandbox",
      total: 1500,
      periodos: 2,
      expires_at: "2026-07-28T23:00:00.000Z",
      reused: false,
    }),
    true,
  );
});

test("rejects non-HTTPS checkout URLs", () => {
  assert.equal(
    isMercadoPagoCheckout({
      intencion_id: "0d7c3138-0125-40e8-9765-a7c850788429",
      checkout_url: "javascript:alert(1)",
      environment: "sandbox",
      total: 1500,
      periodos: 2,
      expires_at: "2026-07-28T23:00:00.000Z",
      reused: false,
    }),
    false,
  );
});

test("maps stable backend errors to resident-friendly Spanish", () => {
  assert.equal(
    mercadoPagoErrorMessage("pago_en_proceso"),
    "Ya hay un pago en proceso. Espera unos minutos y actualiza tu saldo.",
  );
  assert.match(
    mercadoPagoErrorMessage("return_url_no_permitida"),
    /regreso seguro/,
  );
});
