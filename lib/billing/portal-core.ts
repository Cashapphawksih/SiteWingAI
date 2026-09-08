import { BillingAuthenticationError, type CheckoutUser } from "@/lib/billing/checkout-core";

export interface PortalDependencies {
  createSession: (customerId: string, returnUrl: string) => Promise<{ url: string }>;
  findCustomerId: (userId: string) => Promise<string | null>;
}

export class BillingCustomerNotFoundError extends Error {}

export async function createPortalForUser(
  user: CheckoutUser | null,
  origin: string,
  dependencies: PortalDependencies,
) {
  if (!user) throw new BillingAuthenticationError("Authentication required.");
  const customerId = await dependencies.findCustomerId(user.id);
  if (!customerId) throw new BillingCustomerNotFoundError("No Stripe customer exists for this account.");
  const session = await dependencies.createSession(customerId, `${origin}/billing`);
  return session.url;
}
