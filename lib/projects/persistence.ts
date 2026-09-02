import { assertValidWebsiteConfig } from "@/lib/website-config";
import type { WebsiteConfig, WebsiteMedia } from "@/types/website";

function durableMedia(media: WebsiteMedia): { media: WebsiteMedia; replaced: boolean } {
  if (media.kind !== "image" || (media.source !== "temporary" && !media.src.startsWith("blob:"))) {
    return { media, replaced: false };
  }
  return {
    media: { kind: "placeholder", label: media.alt || "Uploaded image" },
    replaced: true,
  };
}

export function prepareWebsiteConfigForPersistence(config: WebsiteConfig): {
  config: WebsiteConfig;
  temporaryMediaCount: number;
} {
  const next = structuredClone(config);
  let temporaryMediaCount = 0;

  for (const page of next.pages) {
    for (const section of page.sections) {
      if (section.type === "hero" && section.content.media) {
        const result = durableMedia(section.content.media);
        section.content.media = result.media;
        if (result.replaced) temporaryMediaCount += 1;
      }
      if (section.type === "gallery") {
        for (const item of section.content.items) {
          const result = durableMedia(item.media);
          item.media = result.media;
          if (result.replaced) temporaryMediaCount += 1;
        }
      }
    }
  }

  assertValidWebsiteConfig(next);
  return { config: next, temporaryMediaCount };
}
