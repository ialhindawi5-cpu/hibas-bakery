import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "../lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind our bakery — homemade cookies, Arab desserts, cheesecake, and sourdough breads, baked fresh to order in small batches.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const s = await getSettings();

  const values = (s.aboutValues || []).map((v) => {
    const parts = v.split("|").map((p) => p.trim());
    return { icon: parts[0] || "✓", title: parts[1] || "", text: parts[2] || "" };
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
                  <div className="num">{v.icon}</div>
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
