"use client";

import { useState, useEffect } from "react";
import type { Question } from "../lib/types";

type Values = Record<string, string | string[]>;

// Split an option like "Chocolate Chip Cookies - 6 pcs - $9" into a name and a
// trailing price so the price can be shown right-aligned.
function splitPrice(o: string): { name: string; price: string } {
  const m = o.match(/^(.*?)\s*-\s*(\$[\d.,]+)\s*$/);
  return m ? { name: m[1].trim(), price: m[2].trim() } : { name: o, price: "" };
}

// Numeric price of an option ("... - $17.50" -> 17.5); 0 if it has no price.
function priceOf(o: string): number {
  const m = o.match(/-\s*\$([\d.,]+)\s*$/);
  return m ? parseFloat(m[1].replace(/,/g, "")) : 0;
}

function fmtMoney(n: number): string {
  return "$" + (Number.isInteger(n) ? String(n) : n.toFixed(2));
}

function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${ampm}`;
}

export default function OrderForm({
  questions,
  menuOptions,
  pickup,
  phoneDisplay,
  successTitle,
  successMessage,
  pickupSlots,
  blockedDates,
}: {
  questions: Question[];
  menuOptions: string[];
  pickup: string;
  phoneDisplay: string;
  successTitle: string;
  successMessage: string;
  pickupSlots: string[];
  blockedDates: string[];
}) {
  // Earliest selectable date (today; same-day pickup allowed). Set after mount
  // to avoid a server/client hydration mismatch.
  const [today, setToday] = useState("");
  useEffect(() => {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    setToday(local.toISOString().slice(0, 10));
  }, []);

  const initial: Values = {};
  for (const q of questions) {
    initial[q.qkey] = q.type === "checkbox" || q.type === "menu" ? [] : "";
  }

  const [values, setValues] = useState<Values>(initial);
  const [hp, setHp] = useState(""); // honeypot — real users leave this empty
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
      if (q.required && isEmpty(q)) {
        e[q.qkey] = "This field is required.";
        continue;
      }
      if (q.type === "date" && !isEmpty(q)) {
        const val = String(values[q.qkey]);
        if (today && val < today) {
          e[q.qkey] = "Please choose today or a later date.";
        } else if (blockedDates.includes(val)) {
          e[q.qkey] = "That date isn't available — please choose another.";
        }
      }
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
    if (orderTotal > 0) {
      answers.push({
        qkey: "order_total",
        label: "Grand Total",
        value: fmtMoney(orderTotal),
      });
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, hp }),
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
          <strong>{successTitle}</strong>
          <br />
          {successMessage} For anything urgent, call <strong>{phoneDisplay}</strong>.
        </div>
      </div>
    );
  }

  // Live total of all selected priced options across the form.
  const orderTotal = questions.reduce((sum, q) => {
    const v = values[q.qkey];
    if (!Array.isArray(v)) return sum;
    return sum + v.reduce((s, o) => s + priceOf(o), 0);
  }, 0);

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <input
        type="text"
        name="company"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
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
                {optionsFor(q).map((o) => {
                  if (o.startsWith("## ")) {
                    return (
                      <div className="opt-group" key={o}>
                        {o.slice(3)}
                      </div>
                    );
                  }
                  const { name, price } = splitPrice(o);
                  return (
                    <label className="opt" key={o}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(v) && v.includes(o)}
                        onChange={() => toggleMulti(q.qkey, o)}
                      />
                      <span className="opt-name">{name}</span>
                      {price && (
                        <>
                          <span className="opt-leader" aria-hidden />
                          <span className="opt-price">{price}</span>
                        </>
                      )}
                    </label>
                  );
                })}
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

            {q.type === "date" && (
              <input
                id={q.qkey}
                type="date"
                min={today || undefined}
                value={typeof v === "string" ? v : ""}
                onChange={(e) => set(q.qkey, e.target.value)}
              />
            )}

            {q.type === "time" && pickupSlots.length > 0 && (
              <select
                id={q.qkey}
                value={typeof v === "string" ? v : ""}
                onChange={(e) => set(q.qkey, e.target.value)}
              >
                <option value="">Select a time…</option>
                {pickupSlots.map((s) => (
                  <option key={s} value={s}>
                    {fmtTime(s)}
                  </option>
                ))}
              </select>
            )}

            {q.type === "time" && pickupSlots.length === 0 && (
              <input
                id={q.qkey}
                type="time"
                value={typeof v === "string" ? v : ""}
                onChange={(e) => set(q.qkey, e.target.value)}
              />
            )}

            {["text", "email", "tel"].includes(q.type) && (
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

      {orderTotal > 0 && (
        <div className="order-total">
          <span>Grand Total</span>
          <span className="order-total-amt">{fmtMoney(orderTotal)}</span>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Sending…" : "Submit order request"}
      </button>
    </form>
  );
}
