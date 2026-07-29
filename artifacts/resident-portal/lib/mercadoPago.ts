export type MercadoPagoCheckout = {
  intencion_id: string;
  checkout_url: string;
  environment: "sandbox" | "production";
  total: number;
  periodos: number;
  expires_at: string;
  reused: boolean;
};

export type MercadoPagoIntentStatus =
  | "creada"
  | "pendiente"
  | "pagada"
  | "pagada_prueba"
  | "fallida"
  | "expirada"
  | "reembolsada";

export function isMercadoPagoCheckout(
  value: unknown,
): value is MercadoPagoCheckout {
  if (!value || typeof value !== "object") return false;

  const checkout = value as Partial<MercadoPagoCheckout>;
  return (
    typeof checkout.intencion_id === "string" &&
    typeof checkout.checkout_url === "string" &&
    checkout.checkout_url.startsWith("https://") &&
    (checkout.environment === "sandbox" ||
      checkout.environment === "production") &&
    typeof checkout.total === "number" &&
    Number.isFinite(checkout.total) &&
    checkout.total > 0 &&
    typeof checkout.periodos === "number"
  );
}

export function mercadoPagoErrorMessage(code: string | undefined): string {
  switch (code) {
    case "sin_adeudo":
      return "No tienes saldo pendiente por pagar.";
    case "pago_en_proceso":
      return "Ya hay un pago en proceso. Espera unos minutos y actualiza tu saldo.";
    case "sesion_invalida":
    case "sin_sesion":
      return "Tu sesión venció. Cierra sesión y vuelve a ingresar.";
    case "mercadopago_no_disponible":
      return "Mercado Pago no está disponible en este momento. Intenta de nuevo más tarde.";
    default:
      return "No pudimos iniciar el pago. Verifica tu conexión e intenta de nuevo.";
  }
}
