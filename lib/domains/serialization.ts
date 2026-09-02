import type { ProjectDomain } from "@/types/domain";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

export function serializeDomain(row: DomainRow): ProjectDomain {
  return {
    id: row.id,
    hostname: row.hostname,
    type: row.type,
    status: row.status,
    verificationToken: row.verification_token,
    verifiedAt: row.verified_at,
    providerSyncedAt: row.provider_synced_at,
    lastError: row.last_error,
  };
}
