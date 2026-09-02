export type DomainType = "sitewing_subdomain" | "custom";
export type DomainStatus = "pending" | "verifying" | "active" | "error";

export interface ProjectDomain {
  id: string;
  hostname: string;
  type: DomainType;
  status: DomainStatus;
  verificationToken: string;
  verifiedAt: string | null;
  providerSyncedAt: string | null;
  lastError: string | null;
}

export interface DnsInstruction {
  purpose: "ownership" | "routing";
  type: "TXT" | "CNAME" | "ALIAS" | "A";
  host: string;
  value: string;
}
