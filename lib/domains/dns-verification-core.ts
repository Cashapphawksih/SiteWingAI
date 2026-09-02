import { getDomain } from "tldts";

export interface DomainDnsResolver {
  resolve4(hostname: string): Promise<string[]>;
  resolveCname(hostname: string): Promise<string[]>;
  resolveTxt(hostname: string): Promise<string[][]>;
}

export interface DomainDnsTargets {
  customDomainTarget: string;
  apexDomainTarget: string;
  apexFallbackIp: string;
}

async function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("DNS lookup timed out.")),
          8_000,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function evaluateDomainDns(
  hostname: string,
  verificationToken: string,
  targets: DomainDnsTargets,
  resolver: DomainDnsResolver,
): Promise<{ ownership: boolean; routing: boolean }> {
  let ownership = false;
  try {
    const records = await withTimeout(
      resolver.resolveTxt(`_sitewing-verification.${hostname}`),
    );
    ownership = records.some((parts) => parts.join("") === verificationToken);
  } catch {
    // Missing records and DNS propagation are normal pending states.
  }

  const isApex = getDomain(hostname, { allowPrivateDomains: false }) === hostname;
  let routing = false;
  try {
    if (isApex) {
      const addresses = await withTimeout(resolver.resolve4(hostname));
      let expectedAddresses: string[] = [];
      try {
        expectedAddresses = await withTimeout(
          resolver.resolve4(targets.apexDomainTarget),
        );
      } catch {
        // The configured fallback remains valid when target resolution fails.
      }
      routing =
        addresses.includes(targets.apexFallbackIp) ||
        addresses.some((address) => expectedAddresses.includes(address));
    } else {
      const cnames = await withTimeout(resolver.resolveCname(hostname));
      const expected = targets.customDomainTarget
        .toLowerCase()
        .replace(/\.$/, "");
      routing = cnames.some(
        (value) => value.toLowerCase().replace(/\.$/, "") === expected,
      );
    }
  } catch {
    // Missing records and DNS propagation are normal pending states.
  }

  return { ownership, routing };
}
