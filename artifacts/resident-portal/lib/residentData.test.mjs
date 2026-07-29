import assert from "node:assert/strict";
import test from "node:test";
import {
  formatResidentDate,
  getNextPendingPayment,
  normalizeRequestStatus,
  parseResidentDate,
  paymentDataState,
  RESIDENT_PAYMENT_SELECT,
  requestStatusLabel,
} from "./residentData.ts";

test("parses date-only values at local noon without shifting the calendar day", () => {
  const date = parseResidentDate("2026-07-01");

  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 6);
  assert.equal(date.getDate(), 1);
  assert.equal(date.getHours(), 12);
});

test("returns a safe label for invalid dates", () => {
  assert.equal(formatResidentDate("not-a-date"), "Fecha no disponible");
});

test("selects the earliest pending payment regardless of input order", () => {
  const next = getNextPendingPayment([
    { estado: "pagado", fecha_vencimiento: "2026-01-01", id: "paid" },
    { estado: "pendiente", fecha_vencimiento: "2026-09-01", id: "later" },
    { estado: "pendiente", fecha_vencimiento: "2026-08-01", id: "next" },
  ]);

  assert.equal(next?.id, "next");
});

test("returns undefined when there are no pending payments", () => {
  assert.equal(
    getNextPendingPayment([
      { estado: "pagado", fecha_vencimiento: "2026-01-01" },
    ]),
    undefined,
  );
});

test("normalizes database request statuses for Spanish UI labels", () => {
  assert.equal(normalizeRequestStatus("En proceso"), "en_proceso");
  assert.equal(normalizeRequestStatus("Resuelta"), "resuelto");
  assert.equal(normalizeRequestStatus(null), "pendiente");
  assert.equal(requestStatusLabel("en_proceso"), "En proceso");
});

test("uses the production pagos primary key in resident payment queries", () => {
  assert.equal(
    RESIDENT_PAYMENT_SELECT,
    "id_pago,monto,estado,fecha_vencimiento,concepto",
  );
});

test("does not treat loading or failed payment data as a debt-free account", () => {
  assert.equal(paymentDataState({ loading: true, error: null }), "unknown");
  assert.equal(
    paymentDataState({ loading: false, error: "network" }),
    "unknown",
  );
  assert.equal(paymentDataState({ loading: false, error: null }), "ready");
});
