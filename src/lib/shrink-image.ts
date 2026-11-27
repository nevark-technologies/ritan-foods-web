/**
 * Browser-side shrinking for admin image uploads.
 *
 * The longest side is capped at 2400 px: sharp on large 2x/3x screens and a little
 * above the existing ~2300 px pack renders. The image is re-encoded as WebP at 0.9,
 * which looks the same as the original (transparency is kept losslessly). The site
 * serves its own AVIF/WebP sizes from this file, so shoppers never download it whole.
 * Re-encoding also drops camera metadata such as GPS location.
 */
const MAX_EDGE = 2400;
const QUALITY = 0.9;

export interface ShrunkImage {
  /** The file to upload: the WebP copy, or the original when that is smaller. */
  file: Blob;
  width: number;
  height: number;
}

/** Throws when the browser can't decode the file as an image. */
export async function shrinkImage(file: File): Promise<ShrunkImage> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, width, height };
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
    canvas.width = canvas.height = 0;
    // Browsers that can't encode WebP hand back a PNG instead: keep the original then.
    if (webp?.type === "image/webp" && webp.size < file.size) return { file: webp, width: w, height: h };
    return { file, width, height };
  } finally {
    bitmap.close();
  }
}
