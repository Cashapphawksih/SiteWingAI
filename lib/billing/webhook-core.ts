import type Stripe from "stripe";

import type { StripeWebhookSecret, StripeWebhookSecretSlot } from "@/lib/billing/config";

export interface StripeSubscriptionUpdate {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  eventCreatedAt: string;
  eventId: string;
  eventType: string;
  status: string;
  stripeCustomerId: string;
  stripePriceId: string | null;
  stripeSubscriptionId: string;
  userId: string;
}

export interface WebhookDependencies {
  applySubscription: (update: StripeSubscriptionUpdate) => Promise<boolean>;
  findUserIdByCustomer: (customerId: string) => Promise<string | null>;
  retrieveSubscription: (subscriptionId: string) => Promise<Stripe.Subscription>;
}

export interface StripeWebhookVerification {
  event: Stripe.Event;
  matchedSecretSlot: StripeWebhookSecretSlot;
}

export class StripeWebhookSignatureError extends Error {
  constructor() {
    super("Stripe webhook signature verification failed.");
    this.name = "StripeWebhookSignatureError";
  }
}

export class StripeWebhookPayloadError extends Error {
  constructor() {
    super("The verified Stripe webhook payload is invalid.");
    this.name = "StripeWebhookPayloadError";
  }
}

function parseVerifiedStripeEvent(body: string | Uint8Array): Stripe.Event {
  try {
    const text = typeof body === "string"
      ? body
      : new TextDecoder("utf-8", { fatal: true }).decode(body);
    const value: unknown = JSON.parse(text);
    if (
      !value ||
      typeof value !== "object" ||
      typeof (value as Record<string, unknown>).id !== "string" ||
      typeof (value as Record<string, unknown>).type !== "string"
    ) {
      throw new StripeWebhookPayloadError();
    }
    return value as Stripe.Event;
  } catch (error: unknown) {
    if (error instanceof StripeWebhookPayloadError) throw error;
    throw new StripeWebhookPayloadError();
  }
}

export function verifyStripeWebhookPayload(
  body: string | Uint8Array,
  signature: string,
  secrets: readonly StripeWebhookSecret[],
  verifyHeader: (payload: string | Uint8Array, header: string, webhookSecret: string) => boolean,
): StripeWebhookVerification {
  for (const candidate of secrets) {
    try {
      verifyHeader(body, signature, candidate.secret);
      return {
        event: parseVerifiedStripeEvent(body),
        matchedSecretSlot: candidate.slot,
      };
    } catch {
      // Try the next configured rotation slot without exposing verifier details.
    }
  }
  throw new StripeWebhookSignatureError();
}

const SUPPORTED_BILLING_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
]);

export function isSupportedStripeBillingEvent(eventType: string) {
  return SUPPORTED_BILLING_EVENT_TYPES.has(eventType);
}

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function objectId(value: string | { id: string } | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const parent = invoice.parent;
  if (parent?.type !== "subscription_details" || !parent.subscription_details) return null;
  return objectId(parent.subscription_details.subscription);
}

async function subscriptionFromEvent(event: Stripe.Event, dependencies: WebhookDependencies) {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      return dependencies.retrieveSubscription(event.data.object.id);
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = objectId(session.subscription);
      return session.mode === "subscription" && subscriptionId
        ? dependencies.retrieveSubscription(subscriptionId)
        : null;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const subscriptionId = invoiceSubscriptionId(event.data.object);
      return subscriptionId ? dependencies.retrieveSubscription(subscriptionId) : null;
    }
    default:
      return null;
  }
}

export async function processVerifiedStripeEvent(event: Stripe.Event, dependencies: WebhookDependencies) {
  const subscription = await subscriptionFromEvent(event, dependencies);
  if (!subscription) return { handled: false, applied: false, userId: null };
  const customerId = objectId(subscription.customer);
  if (!customerId) throw new Error("The Stripe subscription has no customer ID.");
  const metadataUserId = subscription.metadata.sitewing_user_id;
  const userId = USER_ID_PATTERN.test(metadataUserId ?? "")
    ? metadataUserId
    : await dependencies.findUserIdByCustomer(customerId);
  if (!userId) throw new Error("The Stripe customer is not associated with a SiteWing user.");
  const item = subscription.items.data[0];
  const applied = await dependencies.applySubscription({
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: item ? new Date(item.current_period_end * 1000).toISOString() : null,
    currentPeriodStart: item ? new Date(item.current_period_start * 1000).toISOString() : null,
    eventCreatedAt: new Date(event.created * 1000).toISOString(),
    eventId: event.id,
    eventType: event.type,
    status: subscription.status,
    stripeCustomerId: customerId,
    stripePriceId: item?.price.id ?? null,
    stripeSubscriptionId: subscription.id,
    userId,
  });
  return { handled: true, applied, userId };
}
