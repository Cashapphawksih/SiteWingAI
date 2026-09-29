import type { Metadata } from "next";

import { logoutAction } from "@/app/(auth)/actions";
import { AppHeader, AppNotice, PageIntro, StatusBadge, TextLink } from "@/components/ui/app-ui";
import { isStripeCheckoutConfigured } from "@/lib/billing/config";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { BillingStatus } from "@/types/billing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Billing" };

const ACTIVE_STATUSES = new Set<BillingStatus>(["active", "trialing"]);
const SUBSCRIBABLE_STATUSES = new Set<BillingStatus>(["none", "canceled", "incomplete_expired"]);
const statusLabels: Record<BillingStatus, string> = { none: "No subscription", active: "Active", canceled: "Canceled", incomplete: "Payment incomplete", incomplete_expired: "Incomplete subscription expired", past_due: "Past due", paused: "Paused", trialing: "Trialing", unpaid: "Unpaid" };
const errorMessages: Record<string, string> = { checkout: "Stripe Checkout is temporarily unavailable. Please try again.", existing_subscription: "Manage your existing subscription through the billing portal.", portal: "The Stripe billing portal is temporarily unavailable. Please try again." };

function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value)) : null;
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/billing");
  const supabase = await createClient();
  const { data: billing, error } = await supabase.from("billing_accounts").select("stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, cancel_at_period_end").eq("user_id", user.id).maybeSingle();
  const params = await searchParams;
  const checkout = typeof params.checkout === "string" ? params.checkout : null;
  const actionError = typeof params.error === "string" ? errorMessages[params.error] : null;
  const status = billing?.status ?? "none";
  const active = ACTIVE_STATUSES.has(status);
  const canSubscribe = SUBSCRIBABLE_STATUSES.has(status);
  const periodEnd = dateLabel(billing?.current_period_end ?? null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader label="Account" actions={<><TextLink href="/dashboard">Dashboard</TextLink><form action={logoutAction}><button type="submit" className="min-h-9 border border-line px-4 text-xs font-bold hover:border-foreground hover:bg-white">Log out</button></form></>} />
      <main className="mx-auto w-full max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-18">
        <PageIntro eyebrow="Account and plan" title="Billing without the clutter." description="Review the state of your SiteWing subscription or continue to Stripe for secure payment management." />
        <div className="mt-6 space-y-3">
          {checkout === "success" ? <AppNotice tone="success">Checkout completed. Stripe is confirming your subscription through its secure webhook.</AppNotice> : null}
          {checkout === "canceled" ? <AppNotice>Checkout was canceled. No billing changes were made.</AppNotice> : null}
          {actionError ? <AppNotice tone="error">{actionError}</AppNotice> : null}
        </div>
        {error ? (
          <section className="mt-10 max-w-2xl"><AppNotice tone="error"><strong className="block">Billing is temporarily unavailable.</strong> Refresh the page or try again shortly.</AppNotice></section>
        ) : (
          <section className="mt-10 grid overflow-hidden rounded-[6px] border border-line bg-white shadow-[0_18px_60px_rgba(16,17,15,.06)] lg:grid-cols-[1.2fr_0.8fr]" aria-labelledby="subscription-heading">
            <div className="p-7 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-center justify-between gap-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Current plan</p><StatusBadge tone={active ? "live" : "neutral"}>{statusLabels[status] ?? "Unknown"}</StatusBadge></div>
              <h2 id="subscription-heading" className="mt-16 text-4xl font-semibold leading-none tracking-[-0.06em] sm:text-6xl">{active ? "SiteWing subscription" : "Free workspace"}</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted">{active ? "Your paid SiteWing access is synchronized through Stripe." : "You can keep working in your private workspace and subscribe when you are ready."}</p>
              {periodEnd ? <div className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{billing?.cancel_at_period_end ? "Access ends" : "Current period ends"}</p><p className="mt-2 text-lg font-semibold">{periodEnd}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Billing state</p><p className="mt-2 text-lg font-semibold">Synchronized</p></div></div> : null}
            </div>
            <aside className="relative flex flex-col justify-between overflow-hidden bg-dark p-7 text-white sm:p-10 lg:p-12">
              <span className="absolute right-8 top-8 size-2 rounded-[1px] bg-signal shadow-[0_0_0_7px_rgba(218,254,104,.08)]" aria-hidden="true" />
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-signal">Secure billing</p><h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">Plan changes happen in Stripe.</h3><p className="mt-4 text-sm leading-7 text-white/55">Payment details never pass through the SiteWing interface.</p></div>
              <div className="mt-12 grid gap-3">
                {billing?.stripe_customer_id ? <form action="/api/billing/portal" method="post"><button type="submit" className="min-h-12 w-full rounded-[3px] bg-signal px-5 text-sm font-bold text-dark hover:-translate-y-0.5 hover:bg-white">Manage billing <span className="ml-2">↗</span></button></form> : null}
                {canSubscribe ? isStripeCheckoutConfigured() ? <form action="/api/billing/checkout" method="post"><button type="submit" className="min-h-12 w-full rounded-[3px] border border-white/30 px-5 text-sm font-bold hover:border-white hover:bg-white hover:text-dark">Subscribe with Stripe</button></form> : <p className="text-xs leading-5 text-white/45">Subscription checkout is not configured yet.</p> : null}
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
