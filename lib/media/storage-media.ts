import type { WebsiteConfig, WebsiteImageMedia } from "@/types/website";

export const SITE_MEDIA_BUCKET = "site-media";

const uuidPattern = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const storagePathPattern = new RegExp(`^(${uuidPattern})/(${uuidPattern})/(${uuidPattern})\\.(jpg|png|webp)$`, "i");

export function parseProjectMediaPath(path: string) {
  const match = storagePathPattern.exec(path);
  if (!match) return null;
  return {
    userId: match[1].toLowerCase(),
    projectId: match[2].toLowerCase(),
    assetId: match[3].toLowerCase(),
    extension: match[4].toLowerCase() as "jpg" | "png" | "webp",
  };
}

export function createProjectMediaUrl(projectId: string, storagePath: string): string {
  return `/api/projects/${projectId}/media?path=${encodeURIComponent(storagePath)}`;
}

export function createPublishedMediaUrl(publicSlug: string, assetId: string): string {
  return `/api/public-sites/${publicSlug}/media/${assetId}`;
}

export function parsePublishedMediaUrl(src: string) {
  const match = /^\/api\/public-sites\/([a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?)\/media\/([0-9a-f-]{36})$/i.exec(src);
  return match ? { publicSlug: match[1].toLowerCase(), assetId: match[2].toLowerCase() } : null;
}

export function isPersistentStorageMedia(media: unknown): media is WebsiteImageMedia & { source: "storage"; storagePath: string } {
  if (!media || typeof media !== "object") return false;
  const candidate = media as Partial<WebsiteImageMedia>;
  return candidate.kind === "image" && candidate.source === "storage" && typeof candidate.storagePath === "string";
}

export function collectStorageMediaPaths(config: WebsiteConfig): Set<string> {
  const paths = new Set<string>();
  for (const page of config.pages) {
    for (const section of page.sections) {
      if (section.type === "hero" && isPersistentStorageMedia(section.content.media)) {
        paths.add(section.content.media.storagePath);
      }
      if (section.type === "gallery") {
        for (const item of section.content.items) {
          if (isPersistentStorageMedia(item.media)) paths.add(item.media.storagePath);
        }
      }
    }
  }
  return paths;
}

export function collectStorageMedia(config: WebsiteConfig): Map<string, WebsiteImageMedia & { source: "storage"; storagePath: string }> {
  const mediaByPath = new Map<string, WebsiteImageMedia & { source: "storage"; storagePath: string }>();
  for (const page of config.pages) {
    for (const section of page.sections) {
      if (section.type === "hero" && isPersistentStorageMedia(section.content.media)) {
        mediaByPath.set(section.content.media.storagePath, section.content.media);
      }
      if (section.type === "gallery") {
        for (const item of section.content.items) {
          if (isPersistentStorageMedia(item.media)) mediaByPath.set(item.media.storagePath, item.media);
        }
      }
    }
  }
  return mediaByPath;
}
