"use client";

import { useState } from "react";
import type { Question } from "../lib/types";

type Values = Record<string, string | string[]>;

export default function OrderForm({
  questions,
  menuOptions,
  pickup,
  phoneDisplay,
}: {
  questions: Question[];
  menuOptions: string[];
  pickup: string;
  phoneDisplay: string;
}) {
  const initial: Values = {};
  for (const q of questions) {
    initial[q.qkey] = q.type === "checkbox" || q.type === "menu" ? [] : "";
  }

  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  function set(qkey: string, value: string | string[]) {
    setValues((v) => ({ ...v, [qkey]: value }));
  }

  function toggleMulti(qkey: string, option: string) {
    setValues((v) => {
      const arr = Array.isArray(v[qkey]) ? (v[qkey] as string[]) : [];
      return {
        ...v,
        [qkey]: arr.includes(option) ? arr.filter((o) => o !== option) : [...arr, option],
      };
    });
  }

  function optionsFor(q: Question): string[] {
    return q.type === "menu" ? menuOptions : q.options;
  }

  function isEmpty(q: Question): boolean {
    const v = values[q.qkey];
    return Array.isArray(v) ? v.length === 0 : !String(v).trim();
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    for (const q of questions) {
      if (q.required && isEmpty(q)) e[q.qkey] = "This field is required.";
    }
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document.querySelector(".error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const answers = questions.map((q) => {
      const v = values[q.qkey];
      return { qkey: q.qkey, label: q.label, value: Array.isArray(v) ? v.join(", ") : String(v) };
    });

    setSubmitting(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="form-card">
        <div className="success" role="status">
          <strong>Thank you! Your order request has been sent.</strong>
          <br />
          We&apos;ll contact you shortly about details and availability. For anything urgent,
          call <strong>{phoneDisplay}</strong>.
        </div>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="error" style={{ marginBottom: 16, fontSize: "0.95rem" }}>
          {serverError}
        </div>
      )}

      {questions.map((q) => {
        const v = values[q.qkey];
        const err = errors[q.qkey];
        return (
          <div className="field" key={q.qkey}>
            <label className="q" htmlFor={q.qkey}>
              {q.label}
              {q.required && <span className="req">*</span>}
              {(q.type === "menu" || q.type === "checkbox") && (
                <span className="hint">Select all that apply.</span>
              )}
            </label>

            {(q.type === "menu" || q.type === "checkbox") && (
              <div className="options">
                {optionsFor(q).map((o) =>
                  o.startsWith("## ") ? (
                    <div className="opt-group" key={o}>
                      {o.slice(3)}
                    </div>
                  ) : (
                    <label className="opt" key={o}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(v) && v.includes(o)}
                        onChange={() => toggleMulti(q.qkey, o)}
                      />
                      {o}
                    </label>
                  )
                )}
              </div>
            )}

            {q.type === "radio" && (
              <div className="options">
                {q.options.map((o) => (
                  <label className="opt" key={o}>
                    <input
                      type="radio"
                      name={q.qkey}
                      value={o}
                      checked={v === o}
                      onChange={() => set(q.qkey, o)}
                    />
                    {o}
                  </label>
                ))}
              </div>
            )}

            {q.type === "textarea" && (
              <textarea
                id={q.qkey}
                value={typeof v === "string" ? v : ""}
                onChange={(e) => set(q.qkey, e.target.value)}
              />
            )}

            {["text", "email", "tel", "date", "time"].includes(q.type) && (
              <input
                id={q.qkey}
                type={q.type}
                value={typeof v === "string" ? v : ""}
                onChange={(e) => set(q.qkey, e.target.value)}
              />
            )}

            {err && <div className="error">{err}</div>}
          </div>
        );
      })}

      {/* Pickup location (fixed info) */}
      <div className="field">
        <label className="q">Pickup location</label>
        <div className="readonly-box">{pickup}</div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Sending…" : "Submit order request"}
      </button>
    </form>
  );
}
