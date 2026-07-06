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

// Stay comfortably under Vercel's 4.5 MB serverless request-body limit. A body
// bigger than this is rejected at the edge with a non-JSON 413 before our API
// route runs, so we catch it client-side and show a clear message instead.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

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

// Turn a failed upload Response into a human-readable message. Vercel's
// oversized-body rejection is a plain-text 413 (not JSON), so res.json()
// throws — we map that to a clear "too large" message rather than a generic one.
async function uploadErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && data.error) return String(data.error);
  } catch {
    // body wasn't JSON — fall through to status-based messages
  }
  if (res.status === 413) {
    return "That photo is too large to upload. Please choose a smaller image or retake it at a lower resolution.";
  }
  return "Upload failed. Please try again.";
}

// Resize, guard the size, POST the image, and return a normalized result.
// One place to handle every failure mode so each uploader stays a few lines.
export async function uploadImageTo(
  url: string,
  file: File
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  const resized = await resizeImage(file);
  if (resized.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error:
        "That photo is too large to upload. Please choose a smaller image or retake it at a lower resolution.",
    };
  }
  const fd = new FormData();
  fd.append("file", resized);
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", body: fd });
  } catch {
    return { ok: false, error: "Network error while uploading. Check your connection and try again." };
  }
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: true, data };
  }
  return { ok: false, error: await uploadErrorMessage(res) };
}
