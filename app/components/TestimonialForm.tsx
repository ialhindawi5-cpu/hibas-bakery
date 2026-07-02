"use client";

import { useState } from "react";

export default function TestimonialForm() {
  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [hp, setHp] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !quote.trim()) {
      setError("Please enter your name and your review.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quote, rating, hp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="form-card" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="success" role="status">
          <strong>Thank you for your review!</strong>
          <br />
          It will appear on the site once it&apos;s approved.
        </div>
      </div>
    );
  }

  return (
    <form
      className="form-card"
      style={{ maxWidth: 560, margin: "0 auto" }}
      onSubmit={submit}
      noValidate
    >
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
      {error && (
        <div className="error" style={{ marginBottom: 16, fontSize: "0.95rem" }}>
          {error}
        </div>
      )}
      <div className="field">
        <label className="q" htmlFor="tf-name">
          Your name<span className="req">*</span>
        </label>
        <input id="tf-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label className="q">Your rating</label>
        <div className="star-input" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={`star-btn ${n <= (hover || rating) ? "on" : ""}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="q" htmlFor="tf-quote">
          Your review<span className="req">*</span>
        </label>
        <textarea
          id="tf-quote"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          style={{ minHeight: 110 }}
          maxLength={1000}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={sending}>
        {sending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
