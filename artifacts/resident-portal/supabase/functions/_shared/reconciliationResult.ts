export function reconciliationNeedsAttention(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const result = value as { ok?: unknown; error?: unknown };
  return result.ok === false && typeof result.error === "string";
}
