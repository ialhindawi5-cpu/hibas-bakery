"use client";

import { useState, useEffect, useCallback } from "react";
import type { Testimonial } from "../lib/testimonials";

export default function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (i: number) => setIndex(((i % count) + count) % count),
    [count]
  );
  const next = useCallback(() => setIndex((p) => (p + 1) % count), [count]);

  // Auto-advance (paused on hover/focus). Only when there's more than one.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [count, paused, next]);

  // Keep the index valid if the list shrinks.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  return (
    <div
      className="tcarousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="tcarousel-viewport">
        <div
          className="tcarousel-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((t, i) => (
            <div
              className="tcarousel-slide"
              key={t.id}
              aria-hidden={i !== index}
            >
              <figure className="testimonial">
                <div
                  className="testimonial-stars"
                  aria-label={`${t.rating} out of 5 stars`}
                >
                  {"★".repeat(t.rating)}
                  <span className="testimonial-stars-empty">
                    {"★".repeat(5 - t.rating)}
                  </span>
                </div>
                <blockquote>{t.quote}</blockquote>
                <figcaption className="testimonial-author">
                  <span className="testimonial-avatar" aria-hidden>
                    {t.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="testimonial-name">{t.name}</span>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className="tcarousel-arrow prev"
            onClick={() => go(index - 1)}
            aria-label="Previous review"
          >
            ‹
          </button>
          <button
            type="button"
            className="tcarousel-arrow next"
            onClick={next}
            aria-label="Next review"
          >
            ›
          </button>
          <div className="tcarousel-dots">
            {items.map((_, i) => (
              <button
                type="button"
                key={i}
                className={`tcarousel-dot ${i === index ? "on" : ""}`}
                onClick={() => go(i)}
                aria-label={`Go to review ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
