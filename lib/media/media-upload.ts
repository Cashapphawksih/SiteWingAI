import type {
  WebsiteConfig,
  WebsiteImageFit,
  WebsiteImageMedia,
  WebsiteImageMimeType,
} from "@/types/website";

export const MAX_LOCAL_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 12_000;
const MAX_IMAGE_PIXELS = 60_000_000;
const acceptedImageTypes = new Set<WebsiteImageMimeType>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface MediaUploadInput {
  alt: string;
  fit?: WebsiteImageFit;
}

export interface MediaUploadAdapter {
  uploadMedia(file: File, input: MediaUploadInput): Promise<WebsiteImageMedia>;
}

export class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadError";
  }
}

function validateFile(file: File): WebsiteImageMimeType {
  if (file.size === 0) {
    throw new MediaUploadError("Choose a non-empty image file.");
  }
  if (file.size > MAX_LOCAL_IMAGE_BYTES) {
    throw new MediaUploadError("Images must be 10 MB or smaller.");
  }
  if (!acceptedImageTypes.has(file.type as WebsiteImageMimeType)) {
    throw new MediaUploadError("Use a JPEG, PNG, or WebP image.");
  }
  return file.type as WebsiteImageMimeType;
}

function readImageDimensions(objectUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (
        width < 1 ||
        height < 1 ||
        width > MAX_IMAGE_DIMENSION ||
        height > MAX_IMAGE_DIMENSION ||
        width * height > MAX_IMAGE_PIXELS
      ) {
        reject(new MediaUploadError("That image has unsupported dimensions."));
        return;
      }
      resolve({ width, height });
    };
    image.onerror = () => reject(new MediaUploadError("That file could not be decoded as an image."));
    image.src = objectUrl;
  });
}

export const browserLocalMediaUpload: MediaUploadAdapter = {
  async uploadMedia(file, input) {
    const mimeType = validateFile(file);
    const objectUrl = URL.createObjectURL(file);
    try {
      const { width, height } = await readImageDimensions(objectUrl);
      return {
        kind: "image",
        src: objectUrl,
        alt: input.alt.trim() || file.name.replace(/\.[^.]+$/, "") || "Uploaded image",
        source: "temporary",
        mimeType,
        width,
        height,
        fit: input.fit ?? "cover",
      };
    } catch (error: unknown) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseUploadedMedia(value: unknown): WebsiteImageMedia | null {
  if (!isRecord(value) || value.kind !== "image" || value.source !== "storage") return null;
  if (
    typeof value.src !== "string" ||
    typeof value.storagePath !== "string" ||
    typeof value.alt !== "string" ||
    !acceptedImageTypes.has(value.mimeType as WebsiteImageMimeType) ||
    typeof value.width !== "number" ||
    typeof value.height !== "number" ||
    (value.fit !== "cover" && value.fit !== "contain")
  ) return null;
  return value as unknown as WebsiteImageMedia;
}

export function createProjectMediaUploadAdapter(projectId: string): MediaUploadAdapter {
  return {
    async uploadMedia(file, input) {
      validateFile(file);
      const objectUrl = URL.createObjectURL(file);
      try {
        await readImageDimensions(objectUrl);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      const body = new FormData();
      body.set("file", file);
      body.set("alt", input.alt.trim() || file.name.replace(/\.[^.]+$/, "") || "Uploaded image");
      body.set("fit", input.fit ?? "cover");
      const response = await fetch(`/api/projects/${projectId}/media`, { method: "POST", body });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new MediaUploadError("The image upload returned an unreadable response.");
      }
      if (!response.ok) {
        const message = isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string"
          ? payload.error.message
          : "The image could not be uploaded right now.";
        throw new MediaUploadError(message);
      }
      const media = isRecord(payload) ? parseUploadedMedia(payload.media) : null;
      if (!media) throw new MediaUploadError("The uploaded image could not be verified.");
      return media;
    },
  };
}

export function isTemporaryMediaUrl(src: string): boolean {
  return src.startsWith("blob:");
}

export function collectTemporaryMediaUrls(config: WebsiteConfig): Set<string> {
  const urls = new Set<string>();
  for (const page of config.pages) {
    for (const section of page.sections) {
      if (section.type === "hero" && section.content.media?.kind === "image" && isTemporaryMediaUrl(section.content.media.src)) {
        urls.add(section.content.media.src);
      }
      if (section.type === "gallery") {
        for (const item of section.content.items) {
          if (item.media.kind === "image" && isTemporaryMediaUrl(item.media.src)) urls.add(item.media.src);
        }
      }
    }
  }
  return urls;
}
