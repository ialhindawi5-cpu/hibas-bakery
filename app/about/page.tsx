import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getSettings } from "../lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind our bakery — homemade cookies, Arab desserts, cheesecake, and sourdough breads, baked fresh to order in small batches.",
};

export const dynamic = "force-dynamic";

const ICON_PATHS: Record<string, ReactNode> = {
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-11 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18.5 14l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  star: (
    <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.3l6.5-.9z" />
  ),
};

function iconFor(icon: string, title: string, text: string): string {
  const raw = icon.toLowerCase().trim();
  if (ICON_PATHS[raw]) return raw;
  const hay = `${title} ${text}`.toLowerCase();
  if (/love|heart|care|passion/.test(hay)) return "heart";
  if (/ingredient|quality|natural|simple|real|honest/.test(hay)) return "leaf";
  if (/batch|small|hand|fresh|craft|order/.test(hay)) return "sparkle";
  if (/time|hour|fast|quick|ready/.test(hay)) return "clock";
  if (/local|pickup|location|deliver/.test(hay)) return "pin";
  return "star";
}

function ValueIcon({ name }: { name: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name] ?? ICON_PATHS.star}
    </svg>
  );
}

export default async function AboutPage() {
  const s = await getSettings();

  const values = (s.aboutValues || []).map((v) => {
    const parts = v.split("|").map((p) => p.trim());
    const title = parts[1] || "";
    const text = parts[2] || "";
    return { icon: iconFor(parts[0] || "", title, text), title, text };
  });

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="eyebrow">{s.aboutEyebrow}</p>
          <h1>{s.aboutHeadline}</h1>
          <p>{s.aboutIntro}</p>
        </div>
      </div>

      <section>
        <div className="container about">
          <div className="about-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.aboutImage} alt={s.aboutHeading} loading="lazy" />
          </div>
          <div>
            <p className="eyebrow" style={{ color: "var(--accent-2)", letterSpacing: 2 }}>
              {s.aboutSectionEyebrow}
            </p>
            <h2 className="serif">{s.aboutHeading}</h2>
            <p>{s.aboutBody}</p>
            {s.aboutBody2 && <p>{s.aboutBody2}</p>}
            {s.aboutFeatures && s.aboutFeatures.length > 0 && (
              <ul className="feature-list">
                {s.aboutFeatures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {values.length > 0 && (
        <section className="alt-bg">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">{s.promiseEyebrow}</p>
              <h2>{s.promiseHeading}</h2>
            </div>
            <div className="steps">
              {values.map((v, i) => (
                <div className="step" key={i}>
                  <div className="num">
                    <ValueIcon name={v.icon} />
                  </div>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="container">
          <div className="cta-band">
            <h2>{s.aboutCtaHeading}</h2>
            <p>{s.aboutCtaText}</p>
            <Link className="btn btn-ghost" href="/order">
              Place an order
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
