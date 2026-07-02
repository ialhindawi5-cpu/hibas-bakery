import type { Metadata } from "next";
import Link from "next/link";
import { getMenu, getPricedMenu } from "../lib/content";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse the full menu: crinkle cookies, chocolate chip cookies, Arab desserts, cheesecake, and sourdough breads.",
};

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [menu, priced] = await Promise.all([
    getMenu({ activeOnly: true }),
    getPricedMenu(),
  ]);

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

          {priced.length > 0 && (
            <div className="price-list">
              <p className="eyebrow" style={{ textAlign: "center" }}>
                Prices
              </p>
              <h2 className="price-list-title">Sizes &amp; prices</h2>
              <div className="price-cats">
                {priced.map((cat, ci) => (
                  <div className="price-cat" key={cat.category || ci}>
                    {cat.category && (
                      <h3 className="price-cat-title">{cat.category}</h3>
                    )}
                    <ul className="price-rows">
                      {cat.items.map((it, ii) => (
                        <li className="price-row" key={`${it.name}-${ii}`}>
                          <span className="price-name">{it.name}</span>
                          {it.price && (
                            <span className="price-amt">{it.price}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

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
