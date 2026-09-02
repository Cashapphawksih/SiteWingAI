import "server-only";

import type { DnsInstruction } from "@/types/domain";

export interface DomainProvider {
  addDomain(hostname: string): Promise<void>;
  removeDomain(hostname: string): Promise<void>;
  checkDomain(hostname: string): Promise<boolean>;
  getDnsInstructions(hostname: string, verificationToken: string): DnsInstruction[];
}

export class DomainProviderError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "DomainProviderError";
  }
}
