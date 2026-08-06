"use client";

import { useEffect, useRef, useState } from "react";
import { resolvePageSeo } from "@/app/lib/seo";
import { useSettingsForm } from "./SettingsProvider";
import { uploadImageTo } from "./resizeImage";

export default function SeoSharing() {
  const { settings } = useSettingsForm();
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);
  const [img, setImg] = useState<{ src: string | null; custom: boolean }>({
    src: null,
    custom: false,
  });
  const [origin, setOrigin] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/admin/og-image", { cache: "no-store" });
    if (r.ok) setImg(await r.json());
  }

  useEffect(() => {
    setOrigin(window.location.origin.replace(/^https?:\/\//, ""));
    load();
  }, []);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = await uploadImageTo("/api/admin/og-image", file);
    if (r.ok) {
      await load();
      setNote({ type: "ok", msg: "Share image updated. It is live right away." });
    } else {
      setNote({ type: "err", msg: r.error });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function remove() {
    if (!confirm("Remove the share image and fall back to the logo?")) return;
    const res = await fetch("/api/admin/og-image", { method: "DELETE" });
    if (res.ok) {
      await load();
      setNote({ type: "ok", msg: "Share image removed." });
    }
  }

  if (!settings) return <p className="order-meta">Loading…</p>;

  const home = resolvePageSeo(settings, "home");

  return (
    <div className="admin-card">
      <h2>Sharing preview</h2>
      <p className="order-meta" style={{ marginTop: -6 }}>
        The picture and text people see when your link is sent on WhatsApp, Facebook,
        Instagram or iMessage. A wide, well-lit photo of your baking works best —{" "}
        <b>1200 × 630 pixels</b>. If you don&apos;t set one, the logo is used.
      </p>

      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      <div className="seo-share-card">
        {img.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.src} alt="Share preview" />
        ) : (
          <div className="seo-share-empty">No image</div>
        )}
        <div className="seo-share-text">
          <span>{origin || "your-website.com"}</span>
          <b>{home.title}</b>
          <em>{home.description}</em>
        </div>
      </div>

      <p className="order-meta">
        {img.custom
          ? "Using your uploaded share image."
          : img.src
            ? "No share image uploaded — falling back to your logo, which will look small and boxed-in."
            : "No share image and no logo — shared links will show a blank box."}
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={upload}
      />
      <p className="order-meta" style={{ marginTop: 8 }}>
        JPG, PNG or WebP. Large photos are shrunk automatically before uploading.
      </p>
      {img.custom && (
        <button type="button" className="admin-btn-danger" style={{ marginTop: 6 }} onClick={remove}>
          Remove share image
        </button>
      )}

      <div className="admin-note" style={{ marginTop: 14 }}>
        The image and text are cached by WhatsApp and Facebook for a while. After
        changing them, refresh the preview with the{" "}
        <a
          href="https://developers.facebook.com/tools/debug/"
          target="_blank"
          rel="noreferrer"
        >
          Facebook sharing debugger
        </a>
        .
      </div>
    </div>
  );
}
