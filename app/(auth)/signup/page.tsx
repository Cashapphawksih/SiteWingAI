import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signupAction } from "@/app/(auth)/actions";
import { AuthShell } from "@/app/(auth)/auth-shell";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create account" };

const errorMessages: Record<string, string> = {
  configuration: "Supabase is not configured yet. Add the required environment variables to continue.",
  credentials: "Enter a valid email and a password between 8 and 72 characters.",
  signup: "The account could not be created. Try again or use a different email.",
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (isSupabaseConfigured() && await getAuthenticatedUser()) redirect("/dashboard");
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : "";

  return (
    <AuthShell alternateHref="/login" alternateLabel="Already have an account?Log in" description="Create a private workspace for websites that stay editable, validated, and ready for the next session." eyebrow="Start with a project" title="Keep every iteration within reach.">
      <div className="mb-9 border-b border-line pb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">New workspace</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">Create your account</h2>
        <p className="mt-2 text-sm text-muted">Email and password authentication for your private SiteWing workspace.</p>
      </div>
      {errorMessages[errorKey] ? <p className="mb-5 border-l-2 border-danger bg-white px-4 py-3 text-sm text-[#71251f]" role="alert">{errorMessages[errorKey]}</p> : null}
      <form action={signupAction} className="grid gap-5">
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em]">Email<input className="h-13 border border-line bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition-colors focus:border-foreground" type="email" name="email" autoComplete="email" required maxLength={254} /></label>
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em]">Password<input className="h-13 border border-line bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition-colors focus:border-foreground" type="password" name="password" autoComplete="new-password" required minLength={8} maxLength={72} aria-describedby="password-guidance" /></label>
        <p id="password-guidance" className="-mt-2 text-xs leading-5 text-muted">Use 8–72 characters. A password manager is recommended.</p>
        <button className="mt-2 min-h-13 bg-foreground px-5 text-sm font-bold text-background transition-colors hover:bg-accent disabled:opacity-50" type="submit" disabled={!isSupabaseConfigured()}>Create workspace</button>
      </form>
    </AuthShell>
  );
}
