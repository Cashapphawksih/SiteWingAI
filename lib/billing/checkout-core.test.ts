import assert from "node:assert/strict";
import test from "node:test";

import {
  BillingAuthenticationError,
  createCheckoutForUser,
  requireCheckoutUser,
  type CheckoutDependencies,
} from "@/lib/billing/checkout-core";
import { createPortalForUser } from "@/lib/billing/portal-core";

const USER_ID = "123e4567-e89b-42d3-a456-426614174000";

test("unauthenticated Checkout is rejected", () => {
  assert.throws(() => requireCheckoutUser(null), BillingAuthenticationError);
});

test("Checkout derives Stripe metadata and customer ownership from the authenticated user", async () => {
  const observed: { lookup?: string; saved?: string; sessionUser?: string; metadataUser?: string } = {};
  const dependencies: CheckoutDependencies = {
    async findAccount(userId) { observed.lookup = userId; return null; },
    async createCustomer(input) { observed.metadataUser = input.metadata.sitewing_user_id; return { id: "cus_test" }; },
    async saveCustomer(userId) { observed.saved = userId; },
    async createSession(input) { observed.sessionUser = input.userId; return { url: "https://checkout.stripe.test/session" }; },
  };
  const result = await createCheckoutForUser(
    { id: USER_ID, email: "private@example.com" },
    { origin: "https://sitewingai.netlify.app", priceId: "price_test" },
    dependencies,
  );
  assert.equal(result, "https://checkout.stripe.test/session");
  assert.deepEqual(observed, { lookup: USER_ID, metadataUser: USER_ID, saved: USER_ID, sessionUser: USER_ID });
});

test("Customer Portal looks up only the authenticated user's customer", async () => {
  const anotherUser = "123e4567-e89b-42d3-a456-426614174001";
  let lookedUpUser: string | null = null;
  let portalCustomer: string | null = null;
  const url = await createPortalForUser({ id: USER_ID, email: null }, "https://sitewingai.netlify.app", {
    async findCustomerId(userId) { lookedUpUser = userId; return userId === USER_ID ? "cus_owned" : null; },
    async createSession(customerId) { portalCustomer = customerId; return { url: "https://billing.stripe.test/session" }; },
  });
  assert.equal(url, "https://billing.stripe.test/session");
  assert.equal(lookedUpUser, USER_ID);
  assert.equal(portalCustomer, "cus_owned");
  assert.notEqual(lookedUpUser, anotherUser);
});
