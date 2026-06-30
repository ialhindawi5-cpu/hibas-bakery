import Link from "next/link";
import type { Settings } from "../lib/types";

export default function SiteFooter({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4 className="serif">{settings.siteName}</h4>
            <p>
              Fresh, homemade cookies, Arab desserts, cheesecake, and sourdough
              breads — baked to order for pickup at {settings.pickup}.
            </p>
            <p className="footer-hours">🕐 {settings.hours}</p>
          </div>
          <div>
            <h4>Explore</h4>
            <div className="links">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/menu">Menu</Link>
              <Link href="/order">Order</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
          <div>
            <h4>Get in touch</h4>
            <div className="links">
              <a href={`tel:${settings.phoneLink}`}>{settings.phoneDisplay}</a>
              <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
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
          © {year} {settings.siteName} · {settings.pickup}
        </div>
      </div>
    </footer>
  );
}
