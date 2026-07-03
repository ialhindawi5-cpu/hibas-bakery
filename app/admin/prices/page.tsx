"use client";

import { useEffect, useState, useCallback } from "react";
import type { Question } from "@/app/lib/types";

type Item = { name: string; price: string };
type Category = { category: string; items: Item[] };

// Parse order-form options ("## COOKIES" / "Chocolate Chip - 6 pcs - $9")
// into editable categories.
function parseOptions(options: string[]): Category[] {
  const cats: Category[] = [];
  let cur: Category | null = null;
  for (const raw of options) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("## ")) {
      cur = { category: line.slice(3).trim(), items: [] };
      cats.push(cur);
      continue;
    }
    if (!cur) {
      cur = { category: "", items: [] };
      cats.push(cur);
    }
    const m = line.match(/^(.*?)\s*-\s*\$([\d.,]+)\s*$/);
    if (m) cur.items.push({ name: m[1].trim(), price: m[2].trim() });
    else cur.items.push({ name: line, price: "" });
  }
  return cats;
}

// Serialize back to the "## Category" + "Name - $price" line format.
function serialize(cats: Category[]): string[] {
  const out: string[] = [];
  for (const c of cats) {
    if (c.category.trim()) out.push(`## ${c.category.trim()}`);
    for (const it of c.items) {
      const name = it.name.trim();
      if (!name) continue;
      const price = String(it.price).trim().replace(/^\$/, "");
      out.push(price ? `${name} - $${price}` : name);
    }
  }
  return out;
}

export default function AdminPrices() {
  const [cats, setCats] = useState<Category[]>([]);
  const [questionId, setQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions", { cache: "no-store" });
      const qs = (await res.json()) as Question[];
      const candidates = qs.filter(
        (q) => (q.type === "checkbox" || q.type === "menu") && q.options.length > 0
      );
      const priced =
        candidates.find((q) => q.role === "items") ??
        candidates.find((q) =>
          q.options.some((o) => o.startsWith("## ") || o.includes("$"))
        );
      const target = priced ?? qs.find((q) => q.role === "items") ?? null;
      setQuestionId(target ? target.id : null);
      setCats(target ? parseOptions(target.options) : []);
    } catch {
      setNote({ type: "err", msg: "Failed to load prices" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setCat(ci: number, patch: Partial<Category>) {
    setCats((prev) => prev.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  }
  function setItem(ci: number, ii: number, patch: Partial<Item>) {
    setCats((prev) =>
      prev.map((c, i) =>
        i === ci
          ? { ...c, items: c.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
          : c
      )
    );
  }
  function addItem(ci: number) {
    setCats((prev) =>
      prev.map((c, i) => (i === ci ? { ...c, items: [...c.items, { name: "", price: "" }] } : c))
    );
  }
  function removeItem(ci: number, ii: number) {
    setCats((prev) =>
      prev.map((c, i) => (i === ci ? { ...c, items: c.items.filter((_, j) => j !== ii) } : c))
    );
  }
  function addCategory() {
    setCats((prev) => [...prev, { category: "", items: [{ name: "", price: "" }] }]);
  }
  function removeCategory(ci: number) {
    if (!confirm("Remove this whole category?")) return;
    setCats((prev) => prev.filter((_, i) => i !== ci));
  }

  async function save() {
    setSaving(true);
    setNote(null);
    try {
      const options = serialize(cats);
      let res: Response;
      if (questionId) {
        res = await fetch(`/api/admin/questions/${questionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ options, type: "checkbox" }),
        });
      } else {
        // No priced question yet — create the order items selector.
        res = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qkey: "items",
            label: "What would you like to order?",
            type: "checkbox",
            role: "items",
            options,
            required: true,
            sortOrder: 1,
            active: true,
          }),
        });
        const created = await res.json().catch(() => ({}));
        if (res.ok && created?.id) setQuestionId(created.id);
      }
      if (res.ok) {
        setNote({ type: "ok", msg: "Prices saved — live on the menu and order form." });
      } else {
        const data = await res.json().catch(() => ({}));
        setNote({ type: "err", msg: data.error || "Save failed" });
      }
    } catch {
      setNote({ type: "err", msg: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="prices-topbar">
        <div>
          <h1 className="admin-h1">Prices</h1>
          <p className="admin-sub" style={{ margin: 0 }}>
            The sizes &amp; prices shown on the menu and order form. Changes are live immediately.
          </p>
        </div>
        <button className="admin-btn" onClick={save} disabled={saving || loading}>
          {saving ? "Saving…" : "Save prices"}
        </button>
      </div>

      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      {loading ? (
        <p className="order-meta">Loading…</p>
      ) : (
        <>
          {cats.map((cat, ci) => (
            <div className="admin-card" key={ci}>
              <div className="price-cat-head">
                <input
                  className="price-cat-name"
                  value={cat.category}
                  placeholder="Category name (e.g. Cookies)"
                  onChange={(e) => setCat(ci, { category: e.target.value })}
                />
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={() => removeCategory(ci)}
                >
                  Remove
                </button>
              </div>

              {cat.items.map((it, ii) => (
                <div className="price-item-row" key={ii}>
                  <input
                    className="price-item-name"
                    value={it.name}
                    placeholder="Item & size (e.g. Crinkle Cookies - 6 pcs)"
                    onChange={(e) => setItem(ci, ii, { name: e.target.value })}
                  />
                  <div className="price-item-price">
                    <span>$</span>
                    <input
                      inputMode="decimal"
                      value={it.price}
                      placeholder="0"
                      onChange={(e) => setItem(ci, ii, { price: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="price-remove"
                    aria-label="Remove item"
                    onClick={() => removeItem(ci, ii)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="admin-btn-sec"
                style={{ marginTop: 6 }}
                onClick={() => addItem(ci)}
              >
                + Add item
              </button>
            </div>
          ))}

          <button className="admin-btn-sec" onClick={addCategory}>
            + Add category
          </button>
        </>
      )}
    </>
  );
}
