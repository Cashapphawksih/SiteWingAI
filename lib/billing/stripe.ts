import "server-only";

import Stripe from "stripe";

import { getStripeSecretKey } from "@/lib/billing/config";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  stripeClient ??= new Stripe(getStripeSecretKey(), { appInfo: { name: "SiteWing AI" } });
  return stripeClient;
}
