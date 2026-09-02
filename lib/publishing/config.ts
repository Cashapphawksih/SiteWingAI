import { createPublishedMediaUrl, isPersistentStorageMedia, parseProjectMediaPath } from "@/lib/media/storage-media";
import { assertValidWebsiteConfig } from "@/lib/website-config";
import type { WebsiteConfig, WebsiteMedia } from "@/types/website";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  }
  return value;
}

export async function hashWebsiteConfig(config: WebsiteConfig): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalize(config)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function publishMedia(media: WebsiteMedia, publicSlug: string): WebsiteMedia {
  if (!isPersistentStorageMedia(media)) return media;
  const parsed = parseProjectMediaPath(media.storagePath);
  if (!parsed) throw new Error("A persistent image has an invalid storage path.");
  return { ...media, src: createPublishedMediaUrl(publicSlug, parsed.assetId) };
}

export function createPublishedWebsiteConfig(config: WebsiteConfig, publicSlug: string): WebsiteConfig {
  const published = structuredClone(config);
  for (const page of published.pages) {
    for (const section of page.sections) {
      if (section.type === "hero" && section.content.media) section.content.media = publishMedia(section.content.media, publicSlug);
      if (section.type === "gallery") {
        for (const item of section.content.items) item.media = publishMedia(item.media, publicSlug);
      }
    }
  }
  assertValidWebsiteConfig(published);
  return published;
}
