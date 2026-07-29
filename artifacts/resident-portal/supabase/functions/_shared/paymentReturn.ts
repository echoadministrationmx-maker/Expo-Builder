export type CheckoutReturnUrls = {
  success: string;
  failure: string;
  pending: string;
};

export function checkoutReturnUrls(
  requestedUrl: unknown,
  {
    publicBaseUrl,
    environment,
  }: {
    publicBaseUrl: string;
    environment: "sandbox" | "production";
  },
): CheckoutReturnUrls {
  let requested: URL;

  try {
    requested = new URL(
      typeof requestedUrl === "string" && requestedUrl.length <= 500
        ? requestedUrl
        : `${publicBaseUrl}/pago`,
    );
  } catch {
    throw new Error("return_url_invalida");
  }

  const isNativeApp =
    requested.protocol === "resident-portal:" &&
    (requested.hostname === "payment-result" ||
      requested.pathname === "/payment-result");
  const isExpoGo =
    environment === "sandbox" &&
    requested.protocol === "exp:" &&
    requested.pathname.endsWith("/--/payment-result");
  const isEchoWeb =
    requested.protocol === "https:" &&
    ["echoadministration.com", "www.echoadministration.com"].includes(
      requested.hostname,
    );

  if (!isNativeApp && !isExpoGo && !isEchoWeb) {
    throw new Error("return_url_no_permitida");
  }

  const withResult = (result: string) => {
    if (isEchoWeb) {
      const url = new URL(requested.toString());
      url.searchParams.set("result", result);
      return url.toString();
    }

    const bridge = new URL("/pago/", publicBaseUrl);
    bridge.searchParams.set("result", result);
    bridge.searchParams.set("app_return", requested.toString());
    return bridge.toString();
  };

  return {
    success: withResult("success"),
    failure: withResult("failure"),
    pending: withResult("pending"),
  };
}
