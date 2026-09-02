import "server-only";

import sharp from "sharp";

import type { WebsiteImageMimeType } from "@/types/website";

export const MAX_PERSISTENT_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 12_000;
export const MAX_IMAGE_PIXELS = 60_000_000;

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

const supportedFormats = {
  jpeg: { mimeType: "image/jpeg", extension: "jpg" },
  png: { mimeType: "image/png", extension: "png" },
  webp: { mimeType: "image/webp", extension: "webp" },
} as const;

export async function validatePersistentImage(file: File): Promise<{
  bytes: Uint8Array;
  extension: "jpg" | "png" | "webp";
  height: number;
  mimeType: WebsiteImageMimeType;
  width: number;
}> {
  if (file.size === 0) throw new ImageValidationError("Choose a non-empty image file.");
  if (file.size > MAX_PERSISTENT_IMAGE_BYTES) throw new ImageValidationError("Images must be 10 MB or smaller.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const options = {
      failOn: "error" as const,
      limitInputPixels: MAX_IMAGE_PIXELS,
      pages: 1,
      sequentialRead: true,
    };
    const metadata = await sharp(bytes, options).metadata();
    const format = metadata.format && metadata.format in supportedFormats
      ? supportedFormats[metadata.format as keyof typeof supportedFormats]
      : null;
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (!format || format.mimeType !== file.type) {
      throw new ImageValidationError("Use a valid JPEG, PNG, or WebP image.");
    }
    if (
      width < 1 ||
      height < 1 ||
      width > MAX_IMAGE_DIMENSION ||
      height > MAX_IMAGE_DIMENSION ||
      width * height > MAX_IMAGE_PIXELS ||
      (metadata.pages ?? 1) !== 1
    ) {
      throw new ImageValidationError("That image has unsupported dimensions.");
    }

    // stats() forces a complete pixel decode, rejecting truncated or malformed payloads.
    await sharp(bytes, options).stats();
    return { bytes, extension: format.extension, height, mimeType: format.mimeType, width };
  } catch (error: unknown) {
    if (error instanceof ImageValidationError) throw error;
    throw new ImageValidationError("That file could not be decoded as an image.");
  }
}
