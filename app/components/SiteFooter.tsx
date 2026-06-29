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
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer">
                Instagram {settings.instagramHandle}
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
