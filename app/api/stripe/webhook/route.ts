import type Stripe from "stripe";

import { getStripeWebhookSecret } from "@/lib/billing/config";
import { safeBillingError } from "@/lib/billing/diagnostics";
import { getStripeClient } from "@/lib/billing/stripe";
import { processVerifiedStripeEvent, verifyStripeWebhookPayload } from "@/lib/billing/webhook-core";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const MAX_WEBHOOK_BYTES = 1024 * 1024;

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_WEBHOOK_BYTES) {
    return Response.json({ error: "Webhook payload is too large." }, { status: 413 });
  }
  let stripe: ReturnType<typeof getStripeClient>;
  try {
    stripe = getStripeClient();
  } catch (error: unknown) {
    console.error("[billing:webhook] configuration unavailable", JSON.stringify({
      operation: "initialize_webhook",
      ...safeBillingError(error),
    }));
    return Response.json({ error: "Webhook processing is unavailable." }, { status: 503 });
  }
  let event: Stripe.Event;
  try {
    event = verifyStripeWebhookPayload(
      body,
      signature,
      getStripeWebhookSecret(),
      stripe.webhooks.constructEvent.bind(stripe.webhooks),
    );
  } catch (error: unknown) {
    console.warn("[billing:webhook] signature rejected", JSON.stringify({
      operation: "verify_webhook_signature",
      ...safeBillingError(error),
    }));
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await processVerifiedStripeEvent(event, {
      async retrieveSubscription(subscriptionId) {
        return stripe.subscriptions.retrieve(subscriptionId);
      },
      async findUserIdByCustomer(customerId) {
        const { data, error } = await admin
          .from("billing_accounts")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (error) throw error;
        return data?.user_id ?? null;
      },
      async applySubscription(update) {
        const { data, error } = await admin.rpc("apply_stripe_subscription_event", {
          p_event_id: update.eventId,
          p_event_type: update.eventType,
          p_event_created_at: update.eventCreatedAt,
          p_user_id: update.userId,
          p_stripe_customer_id: update.stripeCustomerId,
          p_stripe_subscription_id: update.stripeSubscriptionId,
          p_stripe_price_id: update.stripePriceId,
          p_status: update.status,
          p_current_period_start: update.currentPeriodStart,
          p_current_period_end: update.currentPeriodEnd,
          p_cancel_at_period_end: update.cancelAtPeriodEnd,
        });
        if (error) throw error;
        return data;
      },
    });
    console.info("[billing:webhook] event processed", JSON.stringify({
      operation: "process_webhook_event",
      eventId: event.id,
      eventType: event.type,
      handled: result.handled,
      applied: result.applied,
      userId: result.userId,
    }));
    return Response.json({ received: true });
  } catch (error: unknown) {
    console.error("[billing:webhook] event processing failed", JSON.stringify({
      operation: "process_webhook_event",
      eventId: event.id,
      eventType: event.type,
      ...safeBillingError(error),
    }));
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
