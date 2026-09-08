import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import StripeClient from "stripe";

import { processVerifiedStripeEvent, type StripeSubscriptionUpdate, verifyStripeWebhookPayload } from "@/lib/billing/webhook-core";

const USER_ID = "123e4567-e89b-42d3-a456-426614174000";

function subscription(): Stripe.Subscription {
  return {
    id: "sub_test",
    object: "subscription",
    customer: "cus_test",
    metadata: { sitewing_user_id: USER_ID },
    status: "active",
    cancel_at_period_end: false,
    items: { data: [{ price: { id: "price_test" }, current_period_start: 1_700_000_000, current_period_end: 1_702_592_000 }] },
  } as unknown as Stripe.Subscription;
}

function event(id = "evt_test"): Stripe.Event {
  return {
    id,
    object: "event",
    created: 1_700_000_100,
    type: "customer.subscription.updated",
    data: { object: subscription() },
  } as Stripe.Event;
}

test("a verified subscription event updates the metadata-associated SiteWing user", async () => {
  const updates: StripeSubscriptionUpdate[] = [];
  const result = await processVerifiedStripeEvent(event(), {
    async retrieveSubscription() { return subscription(); },
    async findUserIdByCustomer() { throw new Error("metadata should resolve the user"); },
    async applySubscription(value) { updates.push(value); return true; },
  });
  assert.equal(result.handled, true);
  assert.equal(result.applied, true);
  assert.equal(result.userId, USER_ID);
  assert.equal(updates[0]?.userId, USER_ID);
  assert.equal(updates[0]?.stripeCustomerId, "cus_test");
  assert.equal(updates[0]?.stripeSubscriptionId, "sub_test");
});

test("repeated webhook delivery is idempotent through the event ledger boundary", async () => {
  const processed = new Set<string>();
  let writes = 0;
  const dependencies = {
    async retrieveSubscription() { return subscription(); },
    async findUserIdByCustomer() { return USER_ID; },
    async applySubscription(update: StripeSubscriptionUpdate) {
      if (processed.has(update.eventId)) return false;
      processed.add(update.eventId);
      writes += 1;
      return true;
    },
  };
  const first = await processVerifiedStripeEvent(event("evt_retry"), dependencies);
  const second = await processVerifiedStripeEvent(event("evt_retry"), dependencies);
  assert.equal(first.applied, true);
  assert.equal(second.applied, false);
  assert.equal(writes, 1);
});

test("invalid webhook signatures are rejected before event processing", () => {
  const stripe = new StripeClient("sk_test_placeholder");
  const body = JSON.stringify(event("evt_signed"));
  const secret = "whsec_test_secret";
  const signature = StripeClient.webhooks.generateTestHeaderString({ payload: body, secret });
  assert.equal(
    verifyStripeWebhookPayload(body, signature, secret, stripe.webhooks.constructEvent.bind(stripe.webhooks)).id,
    "evt_signed",
  );
  assert.throws(
    () => verifyStripeWebhookPayload(body, signature, "whsec_wrong", stripe.webhooks.constructEvent.bind(stripe.webhooks)),
    /signature/i,
  );
});
