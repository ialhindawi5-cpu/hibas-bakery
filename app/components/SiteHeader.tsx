"use client";

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

  const words = siteName.split(" ");
  const last = words.length > 1 ? words.pop() : null;
  const rest = words.join(" ");

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
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
      </div>
    </header>
  );
}
