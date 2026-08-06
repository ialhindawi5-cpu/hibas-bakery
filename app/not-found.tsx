import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "Sorry — we couldn't find that page.",
  robots: { index: false, follow: true },
};

// Where people most likely meant to go. Kept static on purpose: a 404 shouldn't
// need a database round-trip, and the footer already carries the contact details.
const LINKS = [
  {
    href: "/menu",
    icon: "🍪",
    title: "Our Menu",
    text: "Cookies, Arab desserts, cheesecake and sourdough breads.",
  },
  {
    href: "/order",
    icon: "🧁",
    title: "Place an Order",
    text: "Choose your treats and a pickup date and time.",
  },
  {
    href: "/contact",
    icon: "💬",
    title: "Contact Us",
    text: "Questions or a custom request? We'd love to hear from you.",
  },
];

export default function NotFound() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="eyebrow">Error 404</p>
          <h1>This page is out of the oven</h1>
          <p>
            We couldn&apos;t find the page you were looking for. It may have been moved, or
            the link might have a small typo in it.
          </p>
          <div className="cta" style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" href="/">
              Back to home
            </Link>
            <Link className="btn btn-ghost" href="/menu">
              Browse the menu
            </Link>
          </div>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="steps">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="step step-link">
                <div className="num" aria-hidden="true">
                  {l.icon}
                </div>
                <h3>{l.title}</h3>
                <p>{l.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
