"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function PublishBar() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const check = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/publish", { cache: "no-store" });
      const d = await r.json();
      setPending(Boolean(d.hasUnpublished));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    check();
    const onChange = () => check();
    window.addEventListener("bk:draft-changed", onChange);
    window.addEventListener("focus", onChange);
    return () => {
      window.removeEventListener("bk:draft-changed", onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [check, pathname]);

  async function publish() {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin/publish", { method: "POST" });
      if (r.ok) {
        setPending(false);
        setMsg("Published! Your changes are now live on the website.");
      } else {
        setMsg("Publish failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    if (!confirm("Discard all unpublished changes and revert to what's live?")) return;
    setBusy(true);
    try {
      await fetch("/api/admin/publish", { method: "DELETE" });
      setPending(false);
      setMsg("Unpublished changes discarded.");
      window.dispatchEvent(new Event("bk:draft-reverted"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`publish-bar ${pending ? "pending" : ""}`}>
      <div className="publish-status">
        {pending ? (
          <>
            <span className="dot" /> You have unpublished changes.
          </>
        ) : msg ? (
          msg
        ) : (
          "Everything is published — the website is up to date."
        )}
      </div>
      <div className="publish-actions">
        {pending && (
          <button className="publish-discard" onClick={discard} disabled={busy}>
            Discard
          </button>
        )}
        <button className="publish-btn" onClick={publish} disabled={busy || !pending}>
          {busy ? "Publishing…" : "Publish to website"}
        </button>
      </div>
    </div>
  );
}
