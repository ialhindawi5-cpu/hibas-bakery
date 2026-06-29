# Homemade Bakery by Hiba — Website

A professional multi-page ordering website for **Homemade Bakery by Hiba**, built with [Next.js](https://nextjs.org) (App Router) + TypeScript. Built to deploy on Vercel. Order requests are emailed to **i.alhindawi5@gmail.com**.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route      | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| `/`        | Home — hero, featured treats, about, how-it-works, gallery   |
| `/menu`    | Full menu with photos                                        |
| `/order`   | Order request form (emails the order to the bakery)          |
| `/contact` | Phone, Instagram, email, pickup location                     |

## Images

Product photos live in `public/images/`:

- `crinkle-cookies.jpg`, `chocolate-chip-cookies.jpg`, `arab-desserts.jpg`,
  `madlouka.jpg`, `sourdough.jpg`, `chocolate-sourdough.jpg`

**Logo:** save the watercolor logo as `public/logo.png`. Until then the header/hero
show a tasteful "H" monogram fallback (no broken images). To add a photo for the
cheesecake, drop a file in `public/images/` and set its `image` in `app/data.ts`.

## Customize

- **Business details** (name, email, phone, Instagram, pickup): `app/data.ts` → `BUSINESS`.
- **Menu items & descriptions:** `app/data.ts` → `MENU` and `GALLERY`.
- **Colors / fonts:** `:root` variables at the top of `app/globals.css`.
- **Order email destination:** `BUSINESS.email` in `app/data.ts`.

## How ordering works

The order form (`app/components/OrderForm.tsx`) validates required fields, then opens
the customer's email app with a pre-filled order addressed to the bakery — no backend
needed. To receive orders without the customer's email app, wire the submit handler to
Formspree, Resend, or a Next.js API route.

## Deploy to Vercel

1. Push to a GitHub repo (your account, `i.alhindawi5@gmail.com`).
2. Import at [vercel.com/new](https://vercel.com/new) and click **Deploy** — Next.js is auto-detected.
