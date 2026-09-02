import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseSecretConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/supabase";

export function createAdminClient() {
  const { url, secretKey } = getSupabaseSecretConfig();
  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
