// Client-side image downscaling for admin uploads.
//
// Phone photos are routinely 4-12 MB, which trips Vercel's 4.5 MB request-body
// limit (the request is rejected before our API route runs, so the user sees a
// generic "Upload failed" with no server message). Resizing in the browser
// before upload keeps us well under that limit and also shrinks the base64
// blob we store in Postgres.
//
// Returns a JPEG File on success. If the browser can't decode the image
// (e.g. HEIC/HEIF), the original File is returned so the server can respond
// with its specific validation message instead of failing silently.

const MAX_DIMENSION = 1600; // px, longest edge
const JPEG_QUALITY = 0.85;

export async function resizeImage(file: File): Promise<File> {
  // Only attempt raster formats the browser can decode into a canvas.
  if (!file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // undecodable (e.g. HEIC) — let the server validate/reject it
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

  // Already small enough and already a web-friendly type: skip re-encoding.
  if (scale === 1 && file.size <= 3 * 1024 * 1024) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
