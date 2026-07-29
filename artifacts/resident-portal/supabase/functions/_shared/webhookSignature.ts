export type MercadoPagoSignature = {
  timestamp: string;
  digest: string;
};

export function parseMercadoPagoSignature(
  value: string | null,
): MercadoPagoSignature | null {
  if (!value) return null;

  let timestamp = "";
  let digest = "";

  for (const part of value.split(",")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    const partValue = part.slice(separator + 1).trim();

    if (key === "ts") timestamp = partValue;
    if (key === "v1") digest = partValue.toLowerCase();
  }

  if (!/^\d{10,16}$/.test(timestamp) || !/^[a-f0-9]{64}$/.test(digest)) {
    return null;
  }

  return { timestamp, digest };
}

export function isMercadoPagoTimestampFresh(
  timestamp: string,
  nowMs = Date.now(),
  toleranceSeconds = 300,
): boolean {
  const parsed = Number(timestamp);
  if (!Number.isFinite(parsed)) return false;

  // Mercado Pago currently sends milliseconds, while older examples and
  // compatible clients may use seconds.
  const timestampMs = parsed >= 1_000_000_000_000 ? parsed : parsed * 1000;
  return Math.abs(nowMs - timestampMs) <= toleranceSeconds * 1000;
}

export function buildMercadoPagoManifest(
  dataId: string,
  requestId: string,
  timestamp: string,
): string {
  const normalizedDataId = /^[a-zA-Z0-9]+$/.test(dataId)
    ? dataId.toLowerCase()
    : dataId;
  return `id:${normalizedDataId};request-id:${requestId};ts:${timestamp};`;
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

export async function verifyMercadoPagoSignature({
  xSignature,
  xRequestId,
  dataId,
  secret,
  nowMs = Date.now(),
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
  nowMs?: number;
}): Promise<boolean> {
  const signature = parseMercadoPagoSignature(xSignature);
  if (!signature || !xRequestId || !dataId || !secret) return false;
  if (!isMercadoPagoTimestampFresh(signature.timestamp, nowMs)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(
      buildMercadoPagoManifest(dataId, xRequestId, signature.timestamp),
    ),
  );
  const expected = [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return constantTimeEqual(expected, signature.digest);
}
