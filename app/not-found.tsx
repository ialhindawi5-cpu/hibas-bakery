import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "Sorry — we couldn't find that page.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="notfound">
      <div className="container">
        {/* Decorative: the heading below carries the meaning for screen readers. */}
        <div className="nf-code" aria-hidden="true">
          404
        </div>
        <h1 className="nf-title">Page Not Found</h1>
        <p className="nf-text">
          The page you were looking for has moved, or never existed.
        </p>
        <Link className="nf-btn" href="/">
          Back Home
          <span className="nf-btn-arrow" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </Link>
      </div>
    </section>
  );
}
