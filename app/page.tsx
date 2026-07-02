import Link from "next/link";
import { getSettings, getFeaturedMenu, getGallery } from "./lib/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, featured, gallery] = await Promise.all([
    getSettings(),
    getFeaturedMenu(),
    getGallery(),
  ]);

  // Duplicate the list so the marquee can loop seamlessly.
  const marquee = featured.length > 0 ? [...featured, ...featured] : [];

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <span className="hero-blob blob-1" aria-hidden />
        <span className="hero-blob blob-2" aria-hidden />
        <span className="hero-blob blob-3" aria-hidden />
        <div className="container hero-inner">
          <p className="eyebrow">Fresh · Homemade · Made to order</p>
          <h1>{settings.heroTitle}</h1>
          <p className="sub">{settings.heroSubtitle}</p>
          <div className="cta">
            <Link className="btn btn-primary" href="/order">
              Place an order
            </Link>
            <Link className="btn btn-ghost" href="/menu">
              View the menu
            </Link>
          </div>
          <ul className="hero-badges">
            <li>🧁 Small-batch &amp; fresh</li>
            <li>📍 Local pickup</li>
            <li>💝 Made to order</li>
          </ul>
        </div>
      </section>

      {/* Announcement ticker */}
      {settings.announcements && settings.announcements.length > 0 && (
        <div className="ticker" aria-label="Announcements">
          <div className="ticker-track">
            {[...settings.announcements, ...settings.announcements].map((a, i) => (
              <span
                className="ticker-item"
                key={i}
                aria-hidden={i >= settings.announcements.length}
              >
                <span className="ticker-star">★</span>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      {marquee.length > 0 && (
        <section>
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Our favourites</p>
              <h2>Freshly baked treats</h2>
              <p>A little taste of what comes out of our kitchen each week.</p>
            </div>
          </div>
          <div className="marquee" aria-label="Featured treats">
            <div
              className="marquee-track"
              style={{ animationDuration: `${Math.max(18, featured.length * 7)}s` }}
            >
              {marquee.map((item, i) => (
                <article
                  className="product marquee-card"
                  key={`${item.id}-${i}`}
                  aria-hidden={i >= featured.length}
                >
                  <div className="product-media">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} loading="lazy" />
                    ) : (
                      <div className="product-placeholder">{item.emoji}</div>
                    )}
                  </div>
                  <div className="product-body">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="container" style={{ textAlign: "center", marginTop: 36 }}>
            <Link className="btn btn-ghost" href="/menu">
              See the full menu
            </Link>
          </div>
        </section>
      )}

      {/* About */}
      <section className="alt-bg">
        <div className="container about">
          <div className="about-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/arab-desserts.jpg" alt="Traditional Arab desserts" loading="lazy" />
          </div>
          <div>
            <p className="eyebrow" style={{ color: "var(--accent-2)", letterSpacing: 2 }}>
              About us
            </p>
            <h2 className="serif">{settings.aboutTitle}</h2>
            <p>{settings.aboutBody}</p>
            <ul className="feature-list">
              <li>Made to order — never sitting on a shelf</li>
              <li>Real ingredients, small batches</li>
              <li>Cookies, Arab sweets, cheesecake &amp; breads</li>
              <li>Convenient pickup at {settings.pickup}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Simple &amp; easy</p>
            <h2>How ordering works</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num">1</div>
              <h3>Choose your treats</h3>
              <p>Browse the menu and pick your favourites.</p>
            </div>
            <div className="step">
              <div className="num">2</div>
              <h3>Send your request</h3>
              <p>Fill in the order form with your pickup date and time.</p>
            </div>
            <div className="step">
              <div className="num">3</div>
              <h3>We confirm &amp; bake</h3>
              <p>We&apos;ll contact you about details, then bake it fresh.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="alt-bg">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">From our kitchen</p>
            <h2>Gallery</h2>
            <p>A peek at what we&apos;ve been baking lately.</p>
          </div>
          <div className="gallery">
            {gallery.map((g) => (
              <figure key={g.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {settings.testimonials && settings.testimonials.length > 0 && (
        <section>
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Kind words</p>
              <h2>What our customers say</h2>
              <p>A few notes from people we&apos;ve baked for.</p>
            </div>
            <div className="testimonials">
              {settings.testimonials.map((t, i) => {
                const parts = t.split("|").map((s) => s.trim());
                const name = parts[0] || "";
                const quote = parts[1] || "";
                const rating =
                  parts[2] && !isNaN(Number(parts[2]))
                    ? Math.max(0, Math.min(5, Math.round(Number(parts[2]))))
                    : 5;
                return (
                  <figure className="testimonial" key={i}>
                    <div
                      className="testimonial-stars"
                      aria-label={`${rating} out of 5 stars`}
                    >
                      {"★".repeat(rating)}
                      <span className="testimonial-stars-empty">
                        {"★".repeat(5 - rating)}
                      </span>
                    </div>
                    <blockquote>{quote}</blockquote>
                    <figcaption className="testimonial-author">
                      <span className="testimonial-avatar" aria-hidden>
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <span className="testimonial-name">{name}</span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section>
        <div className="container">
          <div className="cta-band">
            <h2>Ready to order?</h2>
            <p>
              Place your request online and we&apos;ll be in touch about details
              and availability.
            </p>
            <Link className="btn btn-ghost" href="/order">
              Start your order
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
