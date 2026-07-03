"use client";

import "./admin.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PublishBar from "./components/PublishBar";
import SettingsProvider from "./components/SettingsProvider";

const NAV = [
  { href: "/admin/home", label: "Home Page" },
  { href: "/admin/about", label: "About Page" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/prices", label: "Prices" },
  { href: "/admin/questions", label: "Order Form" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/settings", label: "Settings" },
];

// View/moderate pages have nothing to save or publish (changes are live), so
// the top Save/Publish bar is hidden there.
const NO_PUBLISH_BAR = ["/admin/orders", "/admin/messages", "/admin/testimonials"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const showPublishBar = !NO_PUBLISH_BAR.some((p) => pathname.startsWith(p));

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-side ${menuOpen ? "open" : ""}`}>
        <div className="admin-side-top">
          <div className="admin-brand">
            Bakery
            <span>Admin Dashboard</span>
          </div>
          <button
            type="button"
            className="admin-burger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span className={`burger ${menuOpen ? "is-open" : ""}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
        <nav>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={pathname.startsWith(n.href) ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="admin-side-foot">
          <a href="/" target="_blank" rel="noopener noreferrer">
            ↗ View website
          </a>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <div className="admin-main">
        <SettingsProvider>
          {showPublishBar && <PublishBar />}
          {children}
        </SettingsProvider>
      </div>
    </div>
  );
}
