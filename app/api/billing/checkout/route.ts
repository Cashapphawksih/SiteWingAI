import { createCheckoutForUser, ExistingSubscriptionError } from "@/lib/billing/checkout-core";
import { getBillingOrigin, getStripePriceId } from "@/lib/billing/config";
import { safeBillingError } from "@/lib/billing/diagnostics";
import { getStripeClient } from "@/lib/billing/stripe";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: { code: "unauthorized", message: "Sign in to manage billing." } }, { status: 401 });
  let origin: string;
  try {
    origin = getBillingOrigin();
    const stripe = getStripeClient();
    const admin = createAdminClient();
    const checkoutUrl = await createCheckoutForUser(user, { origin, priceId: getStripePriceId() }, {
      async findAccount(userId) {
        const { data, error } = await admin
          .from("billing_accounts")
          .select("stripe_customer_id, stripe_subscription_id, status")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        return data ? {
          stripeCustomerId: data.stripe_customer_id,
          stripeSubscriptionId: data.stripe_subscription_id,
          status: data.status,
        } : null;
      },
      async createCustomer(input, idempotencyKey) {
        return stripe.customers.create(input, { idempotencyKey });
      },
      async saveCustomer(userId, customerId) {
        const { error } = await admin.from("billing_accounts").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          status: "none",
        }, { onConflict: "user_id" });
        if (error) throw error;
      },
      async createSession(input) {
        return stripe.checkout.sessions.create({
          mode: "subscription",
          customer: input.customerId,
          client_reference_id: input.userId,
          line_items: [{ price: input.priceId, quantity: 1 }],
          metadata: { sitewing_user_id: input.userId },
          subscription_data: { metadata: { sitewing_user_id: input.userId } },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
        });
      },
    });
    return Response.redirect(checkoutUrl, 303);
  } catch (error: unknown) {
    console.error("[billing:checkout] session creation failed", JSON.stringify({
      operation: "create_checkout_session",
      userId: user.id,
      ...safeBillingError(error),
    }));
    const reason = error instanceof ExistingSubscriptionError ? "existing_subscription" : "checkout";
    try {
      return Response.redirect(`${origin!}/billing?error=${reason}`, 303);
    } catch {
      return Response.json({ error: { code: "billing_unavailable", message: "Billing is temporarily unavailable." } }, { status: 503 });
    }
  }
}
