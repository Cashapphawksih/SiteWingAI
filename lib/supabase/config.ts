export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

export interface SupabaseSecretConfig extends SupabasePublicConfig {
  secretKey: string;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return { url, publishableKey };
}

export function getSupabaseSecretConfig(): SupabaseSecretConfig {
  const publicConfig = getSupabasePublicConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("The Supabase server secret is not configured.");
  return { ...publicConfig, secretKey };
}
