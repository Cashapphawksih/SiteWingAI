import type { Metadata } from "next";
import Link from "next/link";

import { logoutAction } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/brand-mark";
import { isStripeCheckoutConfigured } from "@/lib/billing/config";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { BillingStatus } from "@/types/billing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Billing" };

const ACTIVE_STATUSES = new Set<BillingStatus>(["active", "trialing"]);
const SUBSCRIBABLE_STATUSES = new Set<BillingStatus>(["none", "canceled", "incomplete_expired"]);
const statusLabels: Record<BillingStatus, string> = {
  none: "No subscription",
  active: "Active",
  canceled: "Canceled",
  incomplete: "Payment incomplete",
  incomplete_expired: "Incomplete subscription expired",
  past_due: "Past due",
  paused: "Paused",
  trialing: "Trialing",
  unpaid: "Unpaid",
};

const errorMessages: Record<string, string> = {
  checkout: "Stripe Checkout is temporarily unavailable. Please try again.",
  existing_subscription: "Manage your existing subscription through the billing portal.",
  portal: "The Stripe billing portal is temporarily unavailable. Please try again.",
};

function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value)) : null;
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/billing");
  const supabase = await createClient();
  const { data: billing, error } = await supabase
    .from("billing_accounts")
    .select("stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const params = await searchParams;
  const checkout = typeof params.checkout === "string" ? params.checkout : null;
  const actionError = typeof params.error === "string" ? errorMessages[params.error] : null;
  const status = billing?.status ?? "none";
  const active = ACTIVE_STATUSES.has(status);
  const canSubscribe = SUBSCRIBABLE_STATUSES.has(status);
  const periodEnd = dateLabel(billing?.current_period_end ?? null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-line bg-background">
        <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-5 px-5 sm:min-h-20 sm:px-8 lg:px-12">
          <BrandMark />
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground">Dashboard</Link>
            <form action={logoutAction}><button type="submit" className="border border-line px-4 py-2 text-xs font-semibold hover:border-foreground">Log out</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="border-b border-line pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Account settings</p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">Billing</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted">Review your subscription or continue to Stripe to manage billing securely.</p>
        </div>
        {checkout === "success" ? <p className="mt-6 border-l-2 border-accent bg-surface px-4 py-3 text-sm" role="status">Checkout completed. Stripe is confirming your subscription through its secure webhook.</p> : null}
        {checkout === "canceled" ? <p className="mt-6 border-l-2 border-line bg-surface px-4 py-3 text-sm" role="status">Checkout was canceled. No billing changes were made.</p> : null}
        {actionError ? <p className="mt-6 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">{actionError}</p> : null}
        {error ? (
          <section className="mt-10 border border-line bg-surface p-8" role="alert"><h2 className="text-xl font-medium">Billing is temporarily unavailable.</h2><p className="mt-3 text-sm text-muted">Refresh the page or try again shortly.</p></section>
        ) : (
          <section className="mt-10 border border-line bg-surface p-6 sm:p-8" aria-labelledby="subscription-heading">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Current plan</p>
                <h2 id="subscription-heading" className="mt-3 text-2xl font-medium tracking-[-0.03em]">{active ? "SiteWing subscription" : "Free"}</h2>
                <p className="mt-3 text-sm text-muted">Status: {statusLabels[status] ?? "Unknown"}</p>
                {periodEnd ? <p className="mt-2 text-sm text-muted">{billing?.cancel_at_period_end ? "Access ends" : "Current period ends"} {periodEnd}</p> : null}
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:items-end">
                {billing?.stripe_customer_id ? (
                  <form action="/api/billing/portal" method="post"><button type="submit" className="min-h-11 w-full bg-foreground px-5 text-sm font-semibold text-background hover:bg-accent">Manage billing</button></form>
                ) : null}
                {canSubscribe ? (
                  isStripeCheckoutConfigured() ? (
                    <form action="/api/billing/checkout" method="post"><button type="submit" className="min-h-11 w-full border border-foreground px-5 text-sm font-semibold hover:bg-foreground hover:text-background">Subscribe</button></form>
                  ) : <p className="max-w-xs text-right text-xs leading-5 text-muted">Subscription checkout is not configured yet.</p>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
