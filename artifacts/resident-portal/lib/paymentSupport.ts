export type PaymentMethodId = "bank_transfer" | "mercado_pago";

export const PAYMENT_METHODS = [
  { id: "bank_transfer", label: "Transferencia BBVA", icon: "repeat" },
  { id: "mercado_pago", label: "Mercado Pago", icon: "smartphone" },
] as const;

export const BANK_TRANSFER_DETAILS = {
  beneficiary: "Manzana 80 Aldea Tulum A.C.",
  bank: "BBVA",
  account: "0125301696",
  clabe: "012694001253016969",
  formattedClabe: "012 69400 1253 016 969",
  concept: "Edif + Depto + Mes",
  receiptEmail: "aldeamz80@gmail.com",
} as const;

export const PAYMENT_SUPPORT_EMAIL_URL =
  "mailto:echoadministrationmx@gmail.com?subject=Ayuda%20para%20realizar%20un%20pago";

const PAYMENT_SUPPORT_WHATSAPP = "522206808919";

function formatPaymentAmount(amount: number): string {
  return amount.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildBankTransferReceiptEmailUrl(amount: number): string {
  const formattedAmount = formatPaymentAmount(amount);
  const subject = "Comprobante de pago - Manzana 80";
  const body = [
    "Hola, adjunto mi comprobante de pago.",
    `Monto mostrado: ${formattedAmount}.`,
    `Concepto utilizado: ${BANK_TRANSFER_DETAILS.concept}.`,
  ].join("\n");

  return `mailto:${BANK_TRANSFER_DETAILS.receiptEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildPaymentSupportUrl(
  methodId: PaymentMethodId,
  amount: number,
): string {
  const method = PAYMENT_METHODS.find(({ id }) => id === methodId);
  const formattedAmount = formatPaymentAmount(amount);
  const message = [
    "Hola Echo Administration, necesito ayuda para realizar un pago.",
    `Método preferido: ${method?.label ?? methodId}.`,
    `Saldo mostrado: ${formattedAmount}.`,
  ].join(" ");

  return `https://wa.me/${PAYMENT_SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
