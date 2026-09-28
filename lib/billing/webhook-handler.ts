import type Stripe from "stripe";

import type { StripeWebhookSecret } from "@/lib/billing/config";
import {
  isSupportedStripeBillingEvent,
  verifyStripeWebhookPayload,
} from "@/lib/billing/webhook-core";

const MAX_WEBHOOK_BYTES = 1024 * 1024;

interface WebhookProcessingResult {
  applied: boolean;
  handled: boolean;
  userId: string | null;
}

interface StripeWebhookHandlerDependencies {
  processEvent: (event: Stripe.Event) => Promise<WebhookProcessingResult>;
  secrets: readonly StripeWebhookSecret[];
  verifyHeader: (
    payload: string | Uint8Array,
    header: string,
    webhookSecret: string,
  ) => boolean;
}

export async function handleStripeWebhookRequest(
  request: Request,
  dependencies: StripeWebhookHandlerDependencies,
) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.warn("[billing:webhook] signature verification failed", JSON.stringify({
      operation: "verify_webhook_signature",
      verification: "failed",
    }));
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > MAX_WEBHOOK_BYTES) {
    return Response.json({ error: "Webhook payload is too large." }, { status: 413 });
  }

  let verification;
  try {
    verification = verifyStripeWebhookPayload(
      body,
      signature,
      dependencies.secrets,
      dependencies.verifyHeader,
    );
  } catch {
    console.warn("[billing:webhook] signature verification failed", JSON.stringify({
      operation: "verify_webhook_signature",
      verification: "failed",
    }));
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const { event, matchedSecretSlot } = verification;
  console.info("[billing:webhook] signature verification succeeded", JSON.stringify({
    operation: "verify_webhook_signature",
    verification: "succeeded",
    matchedSecretSlot,
    eventId: event.id,
    eventType: event.type,
  }));

  if (!isSupportedStripeBillingEvent(event.type)) {
    console.info("[billing:webhook] verified event ignored", JSON.stringify({
      operation: "ignore_webhook_event",
      eventId: event.id,
      eventType: event.type,
    }));
    return Response.json({ received: true, ignored: true });
  }

  try {
    await dependencies.processEvent(event);
    console.info("[billing:webhook] verified event processed", JSON.stringify({
      operation: "process_webhook_event",
      eventId: event.id,
      eventType: event.type,
    }));
    return Response.json({ received: true });
  } catch {
    console.error("[billing:webhook] verified event processing failed", JSON.stringify({
      operation: "process_webhook_event",
      eventId: event.id,
      eventType: event.type,
    }));
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
