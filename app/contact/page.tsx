import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "../lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch — phone, email, Instagram, and pickup location.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="eyebrow">Say hello</p>
          <h1>Contact &amp; Pickup</h1>
          <p>
            Have a question or a custom request? We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="contact-grid">
            <div className="contact-item">
              <div className="ic">📞</div>
              <div className="label">Phone</div>
              <div className="value">
                <a href={`tel:${settings.phoneLink}`}>{settings.phoneDisplay}</a>
              </div>
            </div>
            <div className="contact-item">
              <div className="ic">📷</div>
              <div className="label">Instagram</div>
              <div className="value">
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer">
                  {settings.instagramHandle}
                </a>
              </div>
            </div>
            <div className="contact-item">
              <div className="ic">✉️</div>
              <div className="label">Email</div>
              <div className="value">
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </div>
            </div>
            <div className="contact-item">
              <div className="ic">📍</div>
              <div className="label">Pickup location</div>
              <div className="value">{settings.pickup}</div>
            </div>
            <div className="contact-item">
              <div className="ic">🕐</div>
              <div className="label">Working hours</div>
              <div className="value">{settings.hours}</div>
            </div>
          </div>

          <div className="map-wrap" style={{ marginTop: 28 }}>
            <iframe
              title="Pickup location map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                settings.mapQuery
              )}&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <p style={{ textAlign: "center", marginTop: 14 }}>
            <a
              className="btn btn-ghost"
              href={`https://www.google.com/maps?q=${encodeURIComponent(settings.mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Google Maps
            </a>
          </p>

          <div className="cta-band" style={{ marginTop: 44 }}>
            <h2>Hungry yet?</h2>
            <p>Browse the menu and place your order request online.</p>
            <Link className="btn btn-ghost" href="/order">
              Order now
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
