import { getStripeWebhookSecrets } from "@/lib/billing/config";
import { safeBillingError } from "@/lib/billing/diagnostics";
import { getStripeClient } from "@/lib/billing/stripe";
import { processVerifiedStripeEvent } from "@/lib/billing/webhook-core";
import { handleStripeWebhookRequest } from "@/lib/billing/webhook-handler";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let stripe: ReturnType<typeof getStripeClient>;
  let secrets: ReturnType<typeof getStripeWebhookSecrets>;
  let verifyHeader: NonNullable<typeof stripe.webhooks.signature>["verifyHeader"];
  try {
    stripe = getStripeClient();
    secrets = getStripeWebhookSecrets();
    if (!stripe.webhooks.signature) throw new Error("Stripe webhook verification is unavailable.");
    verifyHeader = stripe.webhooks.signature.verifyHeader.bind(stripe.webhooks.signature);
  } catch (error: unknown) {
    console.error("[billing:webhook] configuration unavailable", JSON.stringify({
      operation: "initialize_webhook",
      ...safeBillingError(error),
    }));
    return Response.json({ error: "Webhook processing is unavailable." }, { status: 503 });
  }

  return handleStripeWebhookRequest(request, {
    secrets,
    verifyHeader,
    async processEvent(event) {
      const admin = createAdminClient();
      return processVerifiedStripeEvent(event, {
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
    },
  });
}
