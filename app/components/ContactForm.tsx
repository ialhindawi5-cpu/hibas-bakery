"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !message.trim()) {
      setError("Please enter your name and a message.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
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
      <div className="form-card" style={{ maxWidth: 640 }}>
        <div className="success" role="status">
          <strong>Thanks for reaching out!</strong>
          <br />
          We&apos;ve received your message and will get back to you soon.
        </div>
      </div>
    );
  }

  return (
    <form className="form-card" style={{ maxWidth: 640 }} onSubmit={submit} noValidate>
      {error && (
        <div className="error" style={{ marginBottom: 16, fontSize: "0.95rem" }}>
          {error}
        </div>
      )}
      <div className="row">
        <div className="field">
          <label className="q" htmlFor="cf-name">
            Your name<span className="req">*</span>
          </label>
          <input id="cf-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="q" htmlFor="cf-phone">
            Phone
          </label>
          <input id="cf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="q" htmlFor="cf-email">
          Email
        </label>
        <input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label className="q" htmlFor="cf-message">
          Message<span className="req">*</span>
        </label>
        <textarea
          id="cf-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ minHeight: 120 }}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={sending}>
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
