"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/supabase";

export function createClient() {
  const { url, publishableKey } = getSupabasePublicConfig();
  return createBrowserClient<Database>(url, publishableKey);
}
