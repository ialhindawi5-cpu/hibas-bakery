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
  whatsappNumber,
  successTitle,
  successMessage,
  pickupSlots,
  blockedDates,
  mode = "create",
  initialValues,
  initialQty,
  editToken: editTokenProp,
}: {
  questions: Question[];
  menuOptions: string[];
  pickup: string;
  phoneDisplay: string;
  whatsappNumber: string;
  successTitle: string;
  successMessage: string;
  pickupSlots: string[];
  blockedDates: string[];
  // Edit mode: rehydrate an existing order and PUT changes instead of creating.
  mode?: "create" | "edit";
  initialValues?: Values;
  initialQty?: Record<string, number>;
  editToken?: string;
}) {
  const isEdit = mode === "edit";
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
  // In edit mode, start from the saved order's form state.
  const initialState: Values = initialValues ? { ...initial, ...initialValues } : initial;

  const [values, setValues] = useState<Values>(initialState);
  // Quantity per selected priced option, keyed by "<qkey>|<option>". Defaults to 1.
  const [qty, setQty] = useState<Record<string, number>>(initialQty || {});
  const [hp, setHp] = useState(""); // honeypot — real users leave this empty
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [serverError, setServerError] = useState("");
  // Pre-filled WhatsApp message built from the submitted order.
  const [waText, setWaText] = useState("");
  // Edit link + deadline shown after a successful create (from the API response),
  // or carried through from props while editing.
  const [editToken, setEditToken] = useState<string | null>(editTokenProp || null);
  const [copied, setCopied] = useState(false);

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

  const qtyKey = (qkey: string, o: string) => `${qkey}|${o}`;
  const getQty = (qkey: string, o: string) => qty[qtyKey(qkey, o)] || 1;
  function setQtyFor(qkey: string, o: string, n: number) {
    const clamped = Math.max(1, Math.min(99, Math.floor(n) || 1));
    setQty((m) => ({ ...m, [qtyKey(qkey, o)]: clamped }));
  }

  // Turn a selected option into its saved value. Keeps a trailing "$<amount>"
  // that equals the LINE total (unit × qty) so totals and the invoice parse it
  // correctly; adds "× N" to the description when more than one is ordered.
  function formatSelected(qkey: string, o: string): string {
    const n = getQty(qkey, o);
    const unit = priceOf(o);
    if (unit > 0) {
      const { name } = splitPrice(o);
      return n > 1 ? `${name} × ${n} - ${fmtMoney(unit * n)}` : `${name} - ${fmtMoney(unit)}`;
    }
    return n > 1 ? `${o} × ${n}` : o;
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
      const value = Array.isArray(v)
        ? v.map((o) => formatSelected(q.qkey, o)).join(", ")
        : String(v);
      return { qkey: q.qkey, label: q.label, value };
    });
    if (orderTotal > 0) {
      answers.push({
        qkey: "order_total",
        label: "Grand Total",
        value: fmtMoney(orderTotal),
      });
    }

    // Build a readable WhatsApp message from the same answers.
    const waLines = [`🧁 ${isEdit ? "Updated" : "New"} order — Hiba's Bakery`, ""];
    for (const a of answers) {
      if (a.value && a.value.trim()) waLines.push(`${a.label}: ${a.value}`);
    }
    waLines.push("", `Pickup: ${pickup}`);
    setWaText(waLines.join("\n"));

    // Raw form state so the customer's edit page can rehydrate the form exactly.
    const formState = { values, qty };

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/order/${editToken}` : "/api/order", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, hp, formState }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(data.error || "Something went wrong. Please try again.");
        return;
      }
      if (!isEdit && data.editToken) setEditToken(data.editToken);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!editToken) return;
    if (
      !window.confirm(
        "Cancel this order? This will let the bakery know you no longer need it. This cannot be undone."
      )
    )
      return;
    setServerError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/order/${editToken}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(data.error || "Could not cancel your order. Please try again.");
        return;
      }
      setCancelled(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (cancelled) {
    return (
      <div className="form-card">
        <div className="notice-box">
          <strong>Your order has been cancelled.</strong>
          <p>
            We&apos;ve let the bakery know. If this was a mistake or you&apos;d like to order
            again, call <strong>{phoneDisplay}</strong> or place a new order.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    const waDigits = (whatsappNumber || "").replace(/\D/g, "");
    const waHref = waDigits
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waText)}`
      : "";
    const editHref =
      editToken && typeof window !== "undefined"
        ? `${window.location.origin}/order/edit/${editToken}`
        : "";
    const copyEditLink = async () => {
      try {
        await navigator.clipboard.writeText(editHref);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        /* clipboard unavailable — the link is still shown for manual copy */
      }
    };
    return (
      <div className="form-card">
        <div className="success" role="status">
          <strong>{isEdit ? "Your order has been updated!" : successTitle}</strong>
          <br />
          {isEdit
            ? "We've saved your changes and let the bakery know."
            : successMessage}{" "}
          For anything urgent, call <strong>{phoneDisplay}</strong>.
        </div>

        {editHref && (
          <div className="edit-cta">
            <div className="edit-cta-head">
              <span className="edit-cta-title">Need to change something?</span>
              <span className="edit-cta-note">
                You can edit or cancel this order any time until you pick it up. Save this
                private link:
              </span>
            </div>
            <div className="edit-cta-row">
              <a className="edit-cta-link" href={editHref}>
                {editHref}
              </a>
              <button type="button" className="edit-cta-copy" onClick={copyEditLink}>
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>
        )}
        {waHref && (
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <p className="order-meta" style={{ marginBottom: 10 }}>
              Want a faster reply? Send your order to us on WhatsApp too:
            </p>
            <a
              className="btn btn-whatsapp"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.5 9.5 0 0 1-4.83-1.32l-.35-.2-3.59.94.96-3.5-.23-.36a9.46 9.46 0 0 1-1.45-5.05c0-5.23 4.26-9.49 9.5-9.49 2.54 0 4.92.99 6.71 2.78a9.42 9.42 0 0 1 2.78 6.72c-.01 5.23-4.27 9.48-9.5 9.48zm8.08-17.56A11.4 11.4 0 0 0 12.05.5C5.78.5.68 5.6.67 11.87c0 2.09.55 4.13 1.59 5.93L.5 23.5l5.35-1.4a11.34 11.34 0 0 0 5.42 1.38h.01c6.27 0 11.37-5.1 11.38-11.37a11.31 11.31 0 0 0-3.33-8.03z" />
              </svg>
              Send order on WhatsApp
            </a>
          </div>
        )}
      </div>
    );
  }

  // Live total of all selected priced options across the form (price × quantity).
  const orderTotal = questions.reduce((sum, q) => {
    const v = values[q.qkey];
    if (!Array.isArray(v)) return sum;
    return sum + v.reduce((s, o) => s + priceOf(o) * getQty(q.qkey, o), 0);
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
      {isEdit && (
        <div className="edit-banner" role="status">
          You&apos;re editing your order. Make your changes below and save — the bakery will
          be notified.
        </div>
      )}

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
                  const checked = Array.isArray(v) && v.includes(o);
                  const n = getQty(q.qkey, o);
                  return (
                    <label className="opt" key={o}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMulti(q.qkey, o)}
                      />
                      <span className="opt-name">{name}</span>
                      {checked && price && (
                        <span
                          className="opt-qty"
                          onClick={(e) => {
                            // Keep clicks on the stepper from toggling the checkbox.
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <button
                            type="button"
                            aria-label={`Decrease ${name} quantity`}
                            disabled={n <= 1}
                            onClick={() => setQtyFor(q.qkey, o, n - 1)}
                          >
                            −
                          </button>
                          <span className="opt-qty-n" aria-live="polite">
                            {n}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${name} quantity`}
                            onClick={() => setQtyFor(q.qkey, o, n + 1)}
                          >
                            +
                          </button>
                        </span>
                      )}
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
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Submit order request"}
      </button>

      {isEdit && editToken && (
        <button
          type="button"
          className="btn-cancel-order"
          onClick={handleCancel}
          disabled={submitting}
        >
          Cancel this order
        </button>
      )}
    </form>
  );
}
