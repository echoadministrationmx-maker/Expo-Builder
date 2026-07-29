import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMercadoPagoManifest,
  isMercadoPagoTimestampFresh,
  parseMercadoPagoSignature,
  verifyMercadoPagoSignature,
} from "../supabase/functions/_shared/webhookSignature.ts";
import { reconciliationNeedsAttention } from "../supabase/functions/_shared/reconciliationResult.ts";

const bytesToHex = (bytes) =>
  [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

test("accepts current Mercado Pago millisecond timestamps", () => {
  assert.equal(
    isMercadoPagoTimestampFresh("1742505638683", 1742505639000),
    true,
  );
});

test("rejects stale webhook timestamps", () => {
  assert.equal(
    isMercadoPagoTimestampFresh("1742505638683", 1742507000000),
    false,
  );
});

test("parses a valid x-signature header", () => {
  assert.deepEqual(
    parseMercadoPagoSignature(
      "ts=1742505638683,v1=ced36ab6d33566bb1e16c125819b8d840d6b8ef136b0b9127c76064466f5229b",
    ),
    {
      timestamp: "1742505638683",
      digest:
        "ced36ab6d33566bb1e16c125819b8d840d6b8ef136b0b9127c76064466f5229b",
    },
  );
});

test("verifies the documented HMAC manifest", async () => {
  const timestamp = "1742505638683";
  const requestId = "bb56a2f1-6aae-46ac-982e-9dcd3581d08e";
  const dataId = "123456";
  const secret = "test-secret";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = bytesToHex(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(
        buildMercadoPagoManifest(dataId, requestId, timestamp),
      ),
    ),
  );

  assert.equal(
    await verifyMercadoPagoSignature({
      xSignature: `ts=${timestamp},v1=${digest}`,
      xRequestId: requestId,
      dataId,
      secret,
      nowMs: 1742505639000,
    }),
    true,
  );
});

test("rejects a webhook signed with another secret", async () => {
  assert.equal(
    await verifyMercadoPagoSignature({
      xSignature:
        "ts=1742505638683,v1=ced36ab6d33566bb1e16c125819b8d840d6b8ef136b0b9127c76064466f5229b",
      xRequestId: "bb56a2f1-6aae-46ac-982e-9dcd3581d08e",
      dataId: "123456",
      secret: "wrong-secret",
      nowMs: 1742505639000,
    }),
    false,
  );
});

test("flags quarantined duplicate payments for operations attention", () => {
  assert.equal(
    reconciliationNeedsAttention({
      ok: false,
      aplicado: false,
      error: "pago_duplicado",
    }),
    true,
  );
  assert.equal(
    reconciliationNeedsAttention({
      ok: true,
      aplicado: false,
      motivo: "ya_aplicado",
    }),
    false,
  );
});
