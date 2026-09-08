import { createPortalForUser } from "@/lib/billing/portal-core";
import { getBillingOrigin } from "@/lib/billing/config";
import { safeBillingError } from "@/lib/billing/diagnostics";
import { getStripeClient } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: { code: "unauthorized", message: "Sign in to manage billing." } }, { status: 401 });
  let origin: string;
  try {
    origin = getBillingOrigin();
    const admin = createAdminClient();
    const stripe = getStripeClient();
    const portalUrl = await createPortalForUser(user, origin, {
      async findCustomerId(userId) {
        const { data, error } = await admin
          .from("billing_accounts")
          .select("stripe_customer_id")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        return data?.stripe_customer_id ?? null;
      },
      async createSession(customerId, returnUrl) {
        return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
      },
    });
    return Response.redirect(portalUrl, 303);
  } catch (error: unknown) {
    console.error("[billing:portal] session creation failed", JSON.stringify({
      operation: "create_portal_session",
      userId: user.id,
      ...safeBillingError(error),
    }));
    try {
      return Response.redirect(`${origin!}/billing?error=portal`, 303);
    } catch {
      return Response.json({ error: { code: "billing_unavailable", message: "Billing is temporarily unavailable." } }, { status: 503 });
    }
  }
}
