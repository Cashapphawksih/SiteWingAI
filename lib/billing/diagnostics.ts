export function safeBillingError(error: unknown) {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : null;
  const rawMessage = value?.message ?? (typeof error === "string" ? error : undefined);
  const sanitizedMessage = typeof rawMessage === "string"
    ? rawMessage.slice(0, 800)
      .replace(/sk_(?:test|live)_[A-Za-z0-9]+/g, "[REDACTED_STRIPE_KEY]")
      .replace(/whsec_[A-Za-z0-9]+/g, "[REDACTED_WEBHOOK_SECRET]")
      .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_TOKEN]")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    : undefined;
  return {
    name: typeof value?.name === "string" ? value.name : error instanceof Error ? error.name : "UnknownError",
    code: typeof value?.code === "string" ? value.code : undefined,
    status: typeof value?.statusCode === "number" ? value.statusCode : typeof value?.status === "number" ? value.status : undefined,
    message: sanitizedMessage,
  };
}
