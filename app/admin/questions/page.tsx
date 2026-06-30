"use client";

import { useEffect, useState, useCallback } from "react";
import type { Question, QuestionType, QuestionRole } from "@/app/lib/types";

const TYPES: { value: QuestionType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Paragraph" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "radio", label: "Choose one (radio)" },
  { value: "checkbox", label: "Choose many (checkboxes)" },
  { value: "menu", label: "Menu items (auto)" },
];

const ROLES: { value: QuestionRole; label: string }[] = [
  { value: "none", label: "— none —" },
  { value: "name", label: "Customer name" },
  { value: "phone", label: "Phone number" },
  { value: "email", label: "Email address" },
  { value: "date", label: "Pickup date" },
  { value: "time", label: "Pickup time" },
  { value: "items", label: "Order items" },
];

const emptyDraft: Omit<Question, "id"> = {
  qkey: "",
  label: "",
  type: "text",
  options: [],
  required: false,
  role: "none",
  sortOrder: 0,
  active: true,
};

function hasOptions(t: QuestionType) {
  return t === "radio" || t === "checkbox";
}

export default function AdminQuestions() {
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);
  const [draft, setDraft] = useState<Omit<Question, "id">>(emptyDraft);
  const [draftOptions, setDraftOptions] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions", { cache: "no-store" });
      setItems(await res.json());
    } catch {
      setNote({ type: "err", msg: "Failed to load questions" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function patch(id: number, field: keyof Question, value: unknown) {
    setItems((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  }

  async function save(q: Question) {
    const res = await fetch(`/api/admin/questions/${q.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q),
    });
    const data = await res.json().catch(() => ({}));
    setNote(
      res.ok
        ? { type: "ok", msg: `Saved "${q.label}". It's live on the order form.` }
        : { type: "err", msg: data.error || "Save failed" }
    );
  }

  async function remove(q: Question) {
    if (!confirm(`Delete the question "${q.label}"?`)) return;
    const res = await fetch(`/api/admin/questions/${q.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== q.id));
      setNote({ type: "ok", msg: `Deleted "${q.label}"` });
    } else {
      setNote({ type: "err", msg: "Delete failed" });
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.label.trim()) return;
    setAdding(true);
    try {
      const options = draftOptions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, options }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems((prev) => [...prev, data]);
        setDraft(emptyDraft);
        setDraftOptions("");
        setNote({ type: "ok", msg: `Added "${data.label}"` });
      } else {
        setNote({ type: "err", msg: data.error || "Failed to add question" });
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <h1 className="admin-h1">Order Form</h1>
      <p className="admin-sub">
        Edit, reorder, hide, or add questions that customers answer when placing an order.
        Changes are live immediately.
      </p>

      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      {/* Add new question */}
      <div className="admin-card">
        <h2>Add a question</h2>
        <form onSubmit={add}>
          <div className="admin-field">
            <label>Question label</label>
            <input
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="e.g. How many pieces?"
            />
          </div>
          <div className="admin-row">
            <div className="admin-field">
              <label>Answer type</label>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as QuestionType })}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Maps to (optional)</label>
              <select
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value as QuestionRole })}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field" style={{ maxWidth: 110, flex: "0 0 110px" }}>
              <label>Order</label>
              <input
                type="number"
                value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
              />
            </div>
          </div>
          {hasOptions(draft.type) && (
            <div className="admin-field">
              <label>Options (one per line — start a line with &quot;## &quot; for a category heading)</label>
              <textarea
                value={draftOptions}
                onChange={(e) => setDraftOptions(e.target.value)}
                placeholder={"Option 1\nOption 2"}
              />
            </div>
          )}
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={draft.required}
              onChange={(e) => setDraft({ ...draft, required: e.target.checked })}
            />
            Required
          </label>
          <button className="admin-btn" style={{ marginTop: 14 }} disabled={adding}>
            {adding ? "Adding…" : "Add question"}
          </button>
        </form>
      </div>

      {/* Existing questions */}
      {loading ? (
        <p className="order-meta">Loading…</p>
      ) : (
        items.map((q) => (
          <div className="admin-card" key={q.id}>
            <div className="admin-field">
              <label>Question label</label>
              <input value={q.label} onChange={(e) => patch(q.id, "label", e.target.value)} />
            </div>
            <div className="admin-row">
              <div className="admin-field">
                <label>Answer type</label>
                <select
                  value={q.type}
                  onChange={(e) => patch(q.id, "type", e.target.value as QuestionType)}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label>Maps to</label>
                <select
                  value={q.role}
                  onChange={(e) => patch(q.id, "role", e.target.value as QuestionRole)}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field" style={{ maxWidth: 100, flex: "0 0 100px" }}>
                <label>Order</label>
                <input
                  type="number"
                  value={q.sortOrder}
                  onChange={(e) => patch(q.id, "sortOrder", Number(e.target.value))}
                />
              </div>
            </div>
            {hasOptions(q.type) && (
              <div className="admin-field">
                <label>Options (one per line — start a line with &quot;## &quot; for a category heading)</label>
                <textarea
                  value={q.options.join("\n")}
                  onChange={(e) =>
                    patch(
                      q.id,
                      "options",
                      e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              </div>
            )}
            <div className="admin-actions">
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => patch(q.id, "required", e.target.checked)}
                />
                Required
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={q.active}
                  onChange={(e) => patch(q.id, "active", e.target.checked)}
                />
                Visible on form
              </label>
              <button className="admin-btn" onClick={() => save(q)}>
                Save
              </button>
              <button className="admin-btn-danger" onClick={() => remove(q)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </>
  );
}
