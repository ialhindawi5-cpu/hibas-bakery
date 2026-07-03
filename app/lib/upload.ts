// Shared validation for admin image uploads.
//
// We intentionally allow only raster image types. SVG is excluded on purpose:
// an SVG can contain <script>, and since uploaded images are served from our
// own origin, a malicious SVG could execute JavaScript in the site's context
// (stored XSS). Restricting to raster formats removes that vector.

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export type ImageCheck =
  | { ok: true; file: File; type: string }
  | { ok: false; error: string };

export function checkImageUpload(file: unknown, maxBytes: number): ImageCheck {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file uploaded" };
  }
  const type = (file.type || "").toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(type)) {
    return { ok: false, error: "Please upload a JPG, PNG, WebP, or GIF image." };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `Image must be under ${mb} MB` };
  }
  return { ok: true, file, type };
}
