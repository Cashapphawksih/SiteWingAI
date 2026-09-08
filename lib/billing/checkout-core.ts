export interface CheckoutUser {
  id: string;
  email: string | null;
}

export interface CheckoutBillingAccount {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: string;
}

export interface CheckoutDependencies {
  createCustomer: (input: { email?: string; metadata: { sitewing_user_id: string } }, idempotencyKey: string) => Promise<{ id: string }>;
  createSession: (input: {
    cancelUrl: string;
    customerId: string;
    priceId: string;
    successUrl: string;
    userId: string;
  }) => Promise<{ url: string | null }>;
  findAccount: (userId: string) => Promise<CheckoutBillingAccount | null>;
  saveCustomer: (userId: string, customerId: string) => Promise<void>;
}

const NON_TERMINAL_STATUSES = new Set(["active", "trialing", "incomplete", "past_due", "paused", "unpaid"]);

export class BillingAuthenticationError extends Error {}
export class ExistingSubscriptionError extends Error {}

export function requireCheckoutUser(user: CheckoutUser | null): CheckoutUser {
  if (!user) throw new BillingAuthenticationError("Authentication required.");
  return user;
}

export async function createCheckoutForUser(
  user: CheckoutUser,
  config: { origin: string; priceId: string },
  dependencies: CheckoutDependencies,
) {
  const account = await dependencies.findAccount(user.id);
  if (account?.stripeSubscriptionId && NON_TERMINAL_STATUSES.has(account.status)) {
    throw new ExistingSubscriptionError("An existing subscription must be managed through the billing portal.");
  }
  let customerId = account?.stripeCustomerId;
  if (!customerId) {
    const customer = await dependencies.createCustomer({
      ...(user.email ? { email: user.email } : {}),
      metadata: { sitewing_user_id: user.id },
    }, `sitewing-customer-${user.id}`);
    customerId = customer.id;
    await dependencies.saveCustomer(user.id, customerId);
  }
  const session = await dependencies.createSession({
    cancelUrl: `${config.origin}/billing?checkout=canceled`,
    customerId,
    priceId: config.priceId,
    successUrl: `${config.origin}/billing?checkout=success`,
    userId: user.id,
  });
  if (!session.url) throw new Error("Stripe Checkout did not return a redirect URL.");
  return session.url;
}
