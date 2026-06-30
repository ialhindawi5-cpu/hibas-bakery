"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR =
  ".section-head, .product, .step, .gallery figure, .cta-band, .contact-item, .about-media, .about > div, .page-header";

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-enabled");

    const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    els.forEach((el) => {
      if (el.classList.contains("is-visible")) return;
      io.observe(el);
    });

    // Safety net: reveal anything still hidden after a short delay.
    const t = setTimeout(() => {
      els.forEach((el) => el.classList.add("is-visible"));
    }, 2500);

    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
