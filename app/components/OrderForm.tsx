"use client";

import { useState } from "react";

type Errors = Record<string, string>;

export default function OrderForm({
  menuOptions,
  pickup,
  phoneDisplay,
}: {
  menuOptions: string[];
  pickup: string;
  phoneDisplay: string;
}) {
  const [customerStatus, setCustomerStatus] = useState("");
  const [menu, setMenu] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [comments, setComments] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  function toggleMenu(item: string) {
    setMenu((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!customerStatus) e.customerStatus = "Please select an option.";
    if (menu.length === 0) e.menu = "Please choose at least one item.";
    if (!name.trim()) e.name = "Please enter your name.";
    if (!phone.trim()) e.phone = "Please enter your phone number.";
    if (!contactMethod) e.contactMethod = "Please choose a contact method.";
    if (!pickupDate) e.pickupDate = "Please choose a pickup date.";
    if (!pickupTime) e.pickupTime = "Please choose a pickup time.";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document
        .querySelector(".error")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerStatus,
          items: menu,
          allergies,
          name,
          phone,
          email,
          contactMethod,
          comments,
          pickupDate,
          pickupTime,
        }),
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
          We&apos;ll contact you shortly about details and availability. For
          anything urgent, call <strong>{phoneDisplay}</strong>.
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

      {/* Customer status */}
      <div className="field">
        <label className="q">
          Are you a new or existing customer?<span className="req">*</span>
        </label>
        <div className="options">
          {["I am a new customer", "I am an existing customer"].map((o) => (
            <label className="opt" key={o}>
              <input
                type="radio"
                name="customerStatus"
                value={o}
                checked={customerStatus === o}
                onChange={() => setCustomerStatus(o)}
              />
              {o}
            </label>
          ))}
        </div>
        {errors.customerStatus && <div className="error">{errors.customerStatus}</div>}
      </div>

      {/* Menu */}
      <div className="field">
        <label className="q">
          What would you like to order?<span className="req">*</span>
          <span className="hint">Select all that apply.</span>
        </label>
        <div className="options">
          {menuOptions.map((item) => (
            <label className="opt" key={item}>
              <input
                type="checkbox"
                checked={menu.includes(item)}
                onChange={() => toggleMenu(item)}
              />
              {item}
            </label>
          ))}
        </div>
        {errors.menu && <div className="error">{errors.menu}</div>}
      </div>

      {/* Allergies */}
      <div className="field">
        <label className="q" htmlFor="allergies">
          Any allergies?
        </label>
        <textarea
          id="allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Let us know about any allergies or dietary needs."
        />
      </div>

      {/* Name */}
      <div className="field">
        <label className="q" htmlFor="name">
          Your name<span className="req">*</span>
        </label>
        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        {errors.name && <div className="error">{errors.name}</div>}
      </div>

      {/* Phone + Email */}
      <div className="row">
        <div className="field">
          <label className="q" htmlFor="phone">
            Phone number<span className="req">*</span>
          </label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {errors.phone && <div className="error">{errors.phone}</div>}
        </div>
        <div className="field">
          <label className="q" htmlFor="email">
            E-mail
          </label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      {/* Preferred contact */}
      <div className="field">
        <label className="q">
          Preferred contact method<span className="req">*</span>
        </label>
        <div className="options">
          {["Phone", "Email"].map((o) => (
            <label className="opt" key={o}>
              <input
                type="radio"
                name="contactMethod"
                value={o}
                checked={contactMethod === o}
                onChange={() => setContactMethod(o)}
              />
              {o}
            </label>
          ))}
        </div>
        {errors.contactMethod && <div className="error">{errors.contactMethod}</div>}
      </div>

      {/* Pickup date + time */}
      <div className="row">
        <div className="field">
          <label className="q" htmlFor="pickupDate">
            Pickup date<span className="req">*</span>
          </label>
          <input
            id="pickupDate"
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
          {errors.pickupDate && <div className="error">{errors.pickupDate}</div>}
        </div>
        <div className="field">
          <label className="q" htmlFor="pickupTime">
            Pickup time<span className="req">*</span>
          </label>
          <input
            id="pickupTime"
            type="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
          />
          {errors.pickupTime && <div className="error">{errors.pickupTime}</div>}
        </div>
      </div>

      {/* Pickup location */}
      <div className="field">
        <label className="q">Pickup location</label>
        <div className="readonly-box">{pickup}</div>
      </div>

      {/* Comments */}
      <div className="field">
        <label className="q" htmlFor="comments">
          Questions and comments
        </label>
        <textarea id="comments" value={comments} onChange={(e) => setComments(e.target.value)} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Sending…" : "Submit order request"}
      </button>
    </form>
  );
}
