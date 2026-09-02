"use client";

import { useState, type FormEvent } from "react";

import type { DnsInstruction, ProjectDomain } from "@/types/domain";

import styles from "./domain-manager.module.css";

interface DomainManagerProps {
  initialDomains: ProjectDomain[];
  initialInstructions: Record<string, DnsInstruction[]>;
  isPublished: boolean;
  projectId: string;
  publicSlug: string | null;
  rootDomain: string;
}

const labels = { pending: "Pending DNS", verifying: "Verifying", active: "Connected", error: "Error" } as const;

export function DomainManager({ initialDomains, initialInstructions, isPublished, projectId, publicSlug, rootDomain }: DomainManagerProps) {
  const [domains, setDomains] = useState(initialDomains.filter((domain) => domain.type === "custom"));
  const [instructions, setInstructions] = useState(initialInstructions);
  const [hostname, setHostname] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connect(event: FormEvent) {
    event.preventDefault(); setBusyId("create"); setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/domains`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hostname }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "The domain could not be connected.");
      setDomains((current) => [...current, payload.domain]);
      setInstructions((current) => ({ ...current, [payload.domain.id]: payload.instructions }));
      setHostname("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The domain could not be connected."); }
    finally { setBusyId(null); }
  }

  async function verify(domain: ProjectDomain) {
    setBusyId(domain.id); setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/domains/${domain.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify" }) });
      const payload = await response.json();
      if (payload.domain) setDomains((current) => current.map((item) => item.id === domain.id ? payload.domain : item));
      if (!response.ok) throw new Error(payload?.error?.message ?? "Verification failed.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Verification failed."); }
    finally { setBusyId(null); }
  }

  async function remove(domain: ProjectDomain) {
    setBusyId(domain.id); setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/domains/${domain.id}`, { method: "DELETE" });
      if (!response.ok) { const payload = await response.json(); throw new Error(payload?.error?.message ?? "The domain could not be removed."); }
      setDomains((current) => current.filter((item) => item.id !== domain.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The domain could not be removed."); }
    finally { setBusyId(null); }
  }

  return <details className={styles.panel}>
    <summary>Domains</summary>
    <div className={styles.content}>
      <div className={styles.row}><div className={styles.identity}><strong>{publicSlug ? `${publicSlug}.${rootDomain}` : `Your SiteWing subdomain`}</strong><span className={styles.status}>{isPublished ? "Active" : "Available after publishing"}</span></div>{isPublished && publicSlug ? <a href={`https://${publicSlug}.${rootDomain}`} target="_blank" rel="noreferrer">Open site</a> : null}</div>
      {domains.map((domain) => <div className={styles.row} key={domain.id}>
        <div className={styles.identity}><strong>{domain.hostname}</strong><span className={styles.status}>{labels[domain.status]}{domain.lastError ? ` · ${domain.lastError}` : ""}</span></div>
        <div className={styles.actions}>{domain.status !== "active" ? <button type="button" disabled={busyId === domain.id} onClick={() => void verify(domain)}>{busyId === domain.id ? "Checking…" : "Verify"}</button> : <a href={`https://${domain.hostname}`} target="_blank" rel="noreferrer">Open</a>}<button type="button" disabled={busyId === domain.id} onClick={() => void remove(domain)}>Remove</button></div>
        {domain.status !== "active" && instructions[domain.id]?.length ? <div className={styles.instructions}>{instructions[domain.id].some((item) => item.type === "ALIAS") ? <p>Use the ALIAS/ANAME record when your DNS provider supports it; otherwise use the A record. Do not add both.</p> : null}{instructions[domain.id].map((item, index) => <div key={`${item.type}-${index}`}><strong>{item.type}</strong><code>{item.host}</code><code>{item.value}</code></div>)}</div> : null}
      </div>)}
      <form className={styles.form} onSubmit={connect}><label className="sr-only" htmlFor="custom-domain">Custom domain</label><input id="custom-domain" value={hostname} onChange={(event) => setHostname(event.target.value)} placeholder="yourbusiness.com" required maxLength={253}/><button disabled={busyId !== null} type="submit">{busyId === "create" ? "Connecting…" : "Connect domain"}</button></form>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  </details>;
}
