"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/menu", label: "Menu" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader({
  siteName,
  hasLogo = false,
  logoSrc = null,
}: {
  siteName: string;
  hasLogo?: boolean;
  logoSrc?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const words = siteName.split(" ");
  const last = words.length > 1 ? words.pop() : null;
  const rest = words.join(" ");

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <Logo size={46} hasLogo={hasLogo} src={logoSrc} className="brand-logo" />
          <span className="brand-text">
            {rest}
            {last ? (
              <>
                {" "}
                <span>{last}</span>
              </>
            ) : null}
          </span>
        </Link>

        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/order" className="nav-cta">
            Order now
          </Link>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span className={`burger ${open ? "is-open" : ""}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div className={`nav-mobile ${open ? "open" : ""}`}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/order" className="nav-cta" onClick={() => setOpen(false)}>
          Order now
        </Link>
      </div>
    </header>
  );
}
