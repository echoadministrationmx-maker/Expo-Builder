import assert from "node:assert/strict";
import test from "node:test";
import {
  BANK_TRANSFER_DETAILS,
  buildBankTransferReceiptEmailUrl,
  buildPaymentSupportUrl,
  PAYMENT_METHODS,
} from "./paymentSupport.ts";

test("offers the two payment paths confirmed by the condominium", () => {
  assert.deepEqual(
    PAYMENT_METHODS.map(({ id, label }) => ({ id, label })),
    [
      { id: "bank_transfer", label: "Transferencia BBVA" },
      { id: "mercado_pago", label: "Mercado Pago" },
    ],
  );
});

test("addresses a transfer receipt to the confirmed condominium email", () => {
  const url = new URL(buildBankTransferReceiptEmailUrl(1500));

  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, BANK_TRANSFER_DETAILS.receiptEmail);
  assert.match(url.searchParams.get("subject") ?? "", /Comprobante de pago/);
  assert.match(url.searchParams.get("body") ?? "", /MXN 1,500\.00/);
});

test("preserves the confirmed BBVA transfer instructions exactly", () => {
  assert.deepEqual(BANK_TRANSFER_DETAILS, {
    beneficiary: "Manzana 80 Aldea Tulum A.C.",
    bank: "BBVA",
    account: "0125301696",
    clabe: "012694001253016969",
    formattedClabe: "012 69400 1253 016 969",
    concept: "Edif + Depto + Mes",
    receiptEmail: "aldeamz80@gmail.com",
  });
});

test("builds a WhatsApp help request with the selected method and outstanding total", () => {
  const url = new URL(buildPaymentSupportUrl("bank_transfer", 1000.5));
  const message = url.searchParams.get("text");

  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/522206808919");
  assert.match(message ?? "", /Transferencia BBVA/);
  assert.match(message ?? "", /MXN 1,000\.50/);
});

test("labels payment amounts as MXN without formatting them as another currency", () => {
  const receiptBody = new URL(
    buildBankTransferReceiptEmailUrl(1250),
  ).searchParams.get("body");
  const supportMessage = new URL(
    buildPaymentSupportUrl("mercado_pago", 1250),
  ).searchParams.get("text");

  assert.match(receiptBody ?? "", /Monto mostrado: MXN 1,250\.00\./);
  assert.match(supportMessage ?? "", /Saldo mostrado: MXN 1,250\.00\./);
  assert.doesNotMatch(`${receiptBody} ${supportMessage}`, /USD/);
});
