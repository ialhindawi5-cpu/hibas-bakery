import Link from "next/link";
import Logo from "./components/Logo";
import { getSettings, getMenu, getGallery, getLogoInfo } from "./lib/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, menu, gallery, logo] = await Promise.all([
    getSettings(),
    getMenu({ activeOnly: true }),
    getGallery(),
    getLogoInfo(),
  ]);

  const featured = menu.filter((m) => m.image).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <span className="hero-blob blob-1" aria-hidden />
        <span className="hero-blob blob-2" aria-hidden />
        <span className="hero-blob blob-3" aria-hidden />
        <div className="container hero-inner">
          <div className="hero-logo-wrap">
            <Logo size={150} hasLogo={logo.hasLogo} src={logo.src} className="hero-logo" />
          </div>
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

      {/* Featured */}
      <section>
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Our favourites</p>
            <h2>Freshly baked treats</h2>
            <p>A little taste of what comes out of our kitchen each week.</p>
          </div>
          <div className="products">
            {featured.map((item) => (
              <article className="product" key={item.id}>
                <div className="product-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image as string} alt={item.name} loading="lazy" />
                </div>
                <div className="product-body">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <Link className="btn btn-ghost" href="/menu">
              See the full menu
            </Link>
          </div>
        </div>
      </section>

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
