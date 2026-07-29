import assert from "node:assert/strict";
import test from "node:test";
import { checkoutReturnUrls } from "../supabase/functions/_shared/paymentReturn.ts";

const options = {
  publicBaseUrl: "https://www.echoadministration.com",
  environment: "sandbox",
};

test("bridges native callbacks through an HTTPS URL accepted by Mercado Pago", () => {
  const urls = checkoutReturnUrls(
    "resident-portal:///payment-result",
    options,
  );

  for (const [result, value] of Object.entries(urls)) {
    const url = new URL(value);
    assert.equal(url.protocol, "https:");
    assert.equal(url.hostname, "www.echoadministration.com");
    assert.equal(url.pathname, "/pago/");
    assert.equal(url.searchParams.get("result"), result);
    assert.equal(
      url.searchParams.get("app_return"),
      "resident-portal:///payment-result",
    );
  }
});

test("keeps approved Echo web callbacks on HTTPS", () => {
  const urls = checkoutReturnUrls(
    "https://www.echoadministration.com/pago",
    options,
  );

  assert.equal(new URL(urls.success).searchParams.get("result"), "success");
  assert.equal(new URL(urls.success).searchParams.has("app_return"), false);
});

test("rejects callback hosts and schemes outside the allowlist", () => {
  assert.throws(
    () => checkoutReturnUrls("https://example.com/steal", options),
    /return_url_no_permitida/,
  );
  assert.throws(
    () => checkoutReturnUrls("javascript:alert(1)", options),
    /return_url_no_permitida/,
  );
});
