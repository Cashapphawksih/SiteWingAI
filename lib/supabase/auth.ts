import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export function safeReturnPath(value: string | undefined, fallback = "/dashboard"): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return fallback;
  }
  return value;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
}

export async function requireUser(returnTo = "/dashboard"): Promise<AuthenticatedUser> {
  if (!isSupabaseConfigured()) redirect("/login?error=configuration");
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeReturnPath(returnTo))}`);
  return user;
}
