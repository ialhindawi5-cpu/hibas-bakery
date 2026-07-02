import Link from "next/link";
import Logo from "./Logo";
import type { Settings } from "../lib/types";

export default function SiteFooter({
  settings,
  hasLogo = false,
  logoSrc = null,
}: {
  settings: Settings;
  hasLogo?: boolean;
  logoSrc?: string | null;
}) {
  const year = new Date().getFullYear();
  const words = settings.siteName.split(" ");
  const last = words.length > 1 ? words.pop() : null;
  const rest = words.join(" ");

  // Split "Monday – Saturday · 11am – 7pm" into a days line and a time line.
  const hoursParts = (settings.hours || "")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  const hoursDays = hoursParts[0] || settings.hours;
  const hoursTime = hoursParts.slice(1).join(" · ");
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <Logo size={52} hasLogo={hasLogo} src={logoSrc} className="footer-logo" />
              <h4 className="serif">
                {rest}
                {last ? (
                  <>
                    {" "}
                    <span>{last}</span>
                  </>
                ) : null}
              </h4>
            </div>
            <p>{settings.footerText}</p>
            {settings.hours && (
              <div className="footer-hours">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <div className="footer-hours-body">
                  <span className="footer-hours-label">Opening hours</span>
                  <span className="footer-hours-days">{hoursDays}</span>
                  {hoursTime && (
                    <span className="footer-hours-time">{hoursTime}</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <h4>Explore</h4>
            <div className="links">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/menu">Menu</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
          <div>
            <h4>Get in touch</h4>
            <div className="links">
              <a href={`tel:${settings.phoneLink}`} className="footer-contact">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
                </svg>
                {settings.phoneDisplay}
              </a>
              <a
                href={`mailto:${settings.contactEmail}`}
                className="footer-contact"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {settings.contactEmail}
              </a>
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-ig"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                {settings.instagramHandle}
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © {year} {settings.siteName} · {settings.pickup}, Ontario, Canada
        </div>
      </div>
    </footer>
  );
}
