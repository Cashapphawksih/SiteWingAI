import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import StripeClient from "stripe";

import {
  processVerifiedStripeEvent,
  StripeWebhookSignatureError,
  type StripeSubscriptionUpdate,
  verifyStripeWebhookPayload,
} from "@/lib/billing/webhook-core";
import { handleStripeWebhookRequest } from "@/lib/billing/webhook-handler";

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

test("valid primary and secondary webhook signing secrets are accepted", () => {
  const stripe = new StripeClient("sk_test_placeholder");
  const body = JSON.stringify(event("evt_signed"));
  const primarySecret = "whsec_primary_test_secret";
  const secondarySecret = "whsec_secondary_test_secret";
  const primarySignature = StripeClient.webhooks.generateTestHeaderString({ payload: body, secret: primarySecret });
  const secondarySignature = StripeClient.webhooks.generateTestHeaderString({ payload: body, secret: secondarySecret });
  assert.equal(
    verifyStripeWebhookPayload(
      body,
      primarySignature,
      [
        { secret: primarySecret, slot: "primary" },
        { secret: secondarySecret, slot: "secondary" },
      ],
      stripe.webhooks.signature!.verifyHeader.bind(stripe.webhooks.signature),
    ).matchedSecretSlot,
    "primary",
  );
  const secondaryResult = verifyStripeWebhookPayload(
    body,
    secondarySignature,
    [
      { secret: primarySecret, slot: "primary" },
      { secret: secondarySecret, slot: "secondary" },
    ],
    stripe.webhooks.signature!.verifyHeader.bind(stripe.webhooks.signature),
  );
  assert.equal(secondaryResult.event.id, "evt_signed");
  assert.equal(secondaryResult.matchedSecretSlot, "secondary");
});

test("invalid webhook signatures are rejected without exposing configured secrets", () => {
  const stripe = new StripeClient("sk_test_placeholder");
  const body = JSON.stringify(event("evt_signed"));
  const signingSecret = "whsec_sender_secret";
  const primarySecret = "whsec_primary_private";
  const secondarySecret = "whsec_secondary_private";
  const signature = StripeClient.webhooks.generateTestHeaderString({ payload: body, secret: signingSecret });
  assert.throws(
    () => verifyStripeWebhookPayload(
      body,
      signature,
      [
        { secret: primarySecret, slot: "primary" },
        { secret: secondarySecret, slot: "secondary" },
      ],
      stripe.webhooks.signature!.verifyHeader.bind(stripe.webhooks.signature),
    ),
    (error: unknown) => {
      assert.ok(error instanceof StripeWebhookSignatureError);
      assert.doesNotMatch(error.message, new RegExp(`${primarySecret}|${secondarySecret}|${signingSecret}`));
      return true;
    },
  );
});

test("a verified unsupported event returns 200 and is ignored", async () => {
  const stripe = new StripeClient("sk_test_placeholder");
  const unsupported = {
    ...event("evt_ignored"),
    object: "v2.core.event",
    type: "v1.billing.meter.error_report_triggered",
  } as unknown as Stripe.Event;
  const body = JSON.stringify(unsupported);
  const secret = "whsec_unsupported_test";
  const signature = StripeClient.webhooks.generateTestHeaderString({ payload: body, secret });
  let processCalls = 0;
  const response = await handleStripeWebhookRequest(new Request("https://sitewing.test/api/stripe/webhook", {
    method: "POST",
    body,
    headers: { "stripe-signature": signature },
  }), {
    secrets: [{ secret, slot: "primary" }],
    verifyHeader: stripe.webhooks.signature!.verifyHeader.bind(stripe.webhooks.signature),
    async processEvent() { processCalls += 1; return { handled: true, applied: true, userId: USER_ID }; },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true, ignored: true });
  assert.equal(processCalls, 0);
});

test("a valid supported event reaches billing processing", async () => {
  const stripe = new StripeClient("sk_test_placeholder");
  const body = JSON.stringify(event("evt_handler"));
  const secret = "whsec_handler_test";
  const signature = StripeClient.webhooks.generateTestHeaderString({ payload: body, secret });
  let processedEventId: string | null = null;
  const response = await handleStripeWebhookRequest(new Request("https://sitewing.test/api/stripe/webhook", {
    method: "POST",
    body,
    headers: { "stripe-signature": signature },
  }), {
    secrets: [{ secret, slot: "primary" }],
    verifyHeader: stripe.webhooks.signature!.verifyHeader.bind(stripe.webhooks.signature),
    async processEvent(value) {
      processedEventId = value.id;
      return { handled: true, applied: true, userId: USER_ID };
    },
  });
  assert.equal(response.status, 200);
  assert.equal(processedEventId, "evt_handler");
});

test("invalid signature logs never contain signing secrets", async () => {
  const stripe = new StripeClient("sk_test_placeholder");
  const body = JSON.stringify(event("evt_invalid_log"));
  const senderSecret = "whsec_sender_private";
  const configuredSecret = "whsec_configured_private";
  const signature = StripeClient.webhooks.generateTestHeaderString({ payload: body, secret: senderSecret });
  const originalWarn = console.warn;
  const output: string[] = [];
  console.warn = (...values: unknown[]) => { output.push(values.join(" ")); };
  try {
    const response = await handleStripeWebhookRequest(new Request("https://sitewing.test/api/stripe/webhook", {
      method: "POST",
      body,
      headers: { "stripe-signature": signature },
    }), {
      secrets: [{ secret: configuredSecret, slot: "primary" }],
      verifyHeader: stripe.webhooks.signature!.verifyHeader.bind(stripe.webhooks.signature),
      async processEvent() { throw new Error("must not process"); },
    });
    assert.equal(response.status, 400);
  } finally {
    console.warn = originalWarn;
  }
  const logs = output.join("\n");
  assert.doesNotMatch(logs, new RegExp(`${senderSecret}|${configuredSecret}`));
  assert.match(logs, /verification failed/);
});
