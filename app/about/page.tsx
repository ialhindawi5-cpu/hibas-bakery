import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "../lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind our bakery — homemade cookies, Arab desserts, cheesecake, and sourdough breads, baked fresh to order in small batches.",
};

const values = [
  {
    icon: "💝",
    title: "Made with love",
    text: "Every order is baked by hand with care — never rushed, never mass-produced.",
  },
  {
    icon: "🌾",
    title: "Real ingredients",
    text: "Simple, quality ingredients and recipes perfected over the years.",
  },
  {
    icon: "🧁",
    title: "Small batches",
    text: "We bake to order so everything reaches you at its freshest.",
  },
];

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="eyebrow">Our story</p>
          <h1>About {settings.siteName}</h1>
          <p>Homemade with love, one batch at a time.</p>
        </div>
      </div>

      <section>
        <div className="container about">
          <div className="about-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/sourdough.jpg" alt="Freshly baked sourdough loaf" loading="lazy" />
          </div>
          <div>
            <p className="eyebrow" style={{ color: "var(--accent-2)", letterSpacing: 2 }}>
              Who we are
            </p>
            <h2 className="serif">Baked fresh, from our home to yours</h2>
            <p>{settings.aboutBody}</p>
            <p>
              Everything is made to order, so each treat is as fresh as it can
              be. We believe the best baking is honest and unhurried — real
              ingredients, small batches, and a lot of heart.
            </p>
            <ul className="feature-list">
              <li>Handmade to order — never sitting on a shelf</li>
              <li>Cookies, Arab sweets, cheesecake &amp; breads</li>
              <li>Convenient pickup at {settings.pickup}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="alt-bg">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">What we believe</p>
            <h2>Our promise</h2>
          </div>
          <div className="steps">
            {values.map((v) => (
              <div className="step" key={v.title}>
                <div className="num">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="cta-band">
            <h2>Come taste the difference</h2>
            <p>
              Browse the menu and place your order request — we&apos;ll bake it
              fresh, just for you.
            </p>
            <Link className="btn btn-ghost" href="/order">
              Place an order
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
