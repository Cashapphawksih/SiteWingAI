import "server-only";

export type StripeWebhookSecretSlot = "primary" | "secondary";

export interface StripeWebhookSecret {
  secret: string;
  slot: StripeWebhookSecretSlot;
}

function requiredEnv(name: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET" | "STRIPE_SUBSCRIPTION_PRICE_ID") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getStripeSecretKey() {
  return requiredEnv("STRIPE_SECRET_KEY");
}

export function getStripeWebhookSecrets(): StripeWebhookSecret[] {
  const secrets: StripeWebhookSecret[] = [
    { secret: requiredEnv("STRIPE_WEBHOOK_SECRET"), slot: "primary" },
  ];
  const secondary = process.env.STRIPE_WEBHOOK_SECRET_SECONDARY?.trim();
  if (secondary) secrets.push({ secret: secondary, slot: "secondary" });
  return secrets;
}

export function getStripePriceId() {
  const priceId = requiredEnv("STRIPE_SUBSCRIPTION_PRICE_ID");
  if (!/^price_[A-Za-z0-9]+$/.test(priceId)) throw new Error("STRIPE_SUBSCRIPTION_PRICE_ID is invalid.");
  return priceId;
}

export function isStripeCheckoutConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
    process.env.STRIPE_WEBHOOK_SECRET?.trim() &&
    process.env.STRIPE_SUBSCRIPTION_PRICE_ID?.trim(),
  );
}

export function getBillingOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITEWING_PUBLIC_ORIGIN?.trim();
  if (!configured) throw new Error("The SiteWing application origin is not configured.");
  const url = new URL(configured);
  const localHttp = url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if ((url.protocol !== "https:" && !localHttp) || url.username || url.password || url.search || url.hash) {
    throw new Error("The SiteWing application origin is invalid.");
  }
  return url.origin;
}
