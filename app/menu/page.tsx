import type { Metadata } from "next";
import Link from "next/link";
import { getMenu } from "../lib/content";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse the full menu: crinkle cookies, chocolate chip cookies, Arab desserts, cheesecake, and sourdough breads.",
};

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const menu = await getMenu({ activeOnly: true });

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="eyebrow">What we bake</p>
          <h1>Our Menu</h1>
          <p>
            Everything is made fresh to order. Select your favourites on the
            order form and we&apos;ll confirm availability with you.
          </p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="products">
            {menu.map((item) => (
              <article className="product" key={item.id}>
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
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link className="btn btn-primary" href="/order">
              Place an order
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
