import type { Settings, MenuItem, GalleryImage, Question } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  siteName: "Hiba's Bakery",
  orderEmail: "Hiba.alhad@gmail.com",
  contactEmail: "i.alhindawi5@gmail.com",
  phoneDisplay: "+1 (613) 866-3231",
  phoneLink: "+16138663231",
  instagram: "https://instagram.com/hibas_bakery_",
  instagramHandle: "@hibas_bakery_",
  pickup: "267 Aquilo Crescent",
  hours: "Monday – Saturday · 11am – 7pm",
  heroTitle: "Baked with love, just for you",
  heroSubtitle:
    "Cookies, Arab desserts, cheesecake, and sourdough breads — handmade in small batches and ready for pickup.",
  aboutTitle: "Hiba's Bakery",
  aboutBody:
    "Every order is baked fresh, by hand, using simple ingredients and recipes passed down and perfected over the years. From fudgy chocolate crinkles to naturally leavened sourdough, we put care into every batch.",
  aboutEyebrow: "Our story",
  aboutHeadline: "About Us",
  aboutIntro: "Homemade with love, one batch at a time.",
  aboutSectionEyebrow: "Who we are",
  aboutHeading: "Baked fresh, from our home to yours",
  aboutBody2:
    "Everything is made to order, so each treat is as fresh as it can be. We believe the best baking is honest and unhurried — real ingredients, small batches, and a lot of heart.",
  aboutFeatures: [
    "Handmade to order — never sitting on a shelf",
    "Cookies, Arab sweets, cheesecake & breads",
    "Convenient pickup at 267 Aquilo Crescent",
  ],
  promiseEyebrow: "What we believe",
  promiseHeading: "Our promise",
  aboutValues: [
    "💝 | Made with love | Every order is baked by hand with care — never rushed, never mass-produced.",
    "🌾 | Real ingredients | Simple, quality ingredients and recipes perfected over the years.",
    "🧁 | Small batches | We bake to order so everything reaches you at its freshest.",
  ],
  aboutImage: "/images/sourdough.jpg",
  aboutCtaHeading: "Come taste the difference",
  aboutCtaText:
    "Browse the menu and place your order request — we'll bake it fresh, just for you.",
  footerText:
    "Fresh, homemade cookies, Arab desserts, cheesecake, and sourdough breads — baked to order for pickup.",
  orderSuccessTitle: "Thank you! Your order request has been sent.",
  orderSuccessMessage:
    "We'll contact you shortly about details and availability.",
  pickupSlots: ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
  blockedDates: [],
  mapQuery: "45.2888539,-75.9247394",
  announcements: [
    "We're closed on Sundays",
    "Fresh · Homemade · Made to order",
    "Order ahead for the freshest treats",
    "Pickup at 267 Aquilo Crescent",
  ],
};

// Seeded (pre-approved) reviews so the home page isn't empty before real
// customer submissions arrive.
export const DEFAULT_TESTIMONIALS: { name: string; quote: string; rating: number }[] = [
  {
    name: "Sarah M.",
    quote:
      "The crinkle cookies are unreal — fudgy, fresh, and gone within a day. Best I've had!",
    rating: 5,
  },
  {
    name: "Leila K.",
    quote:
      "Ordered maamoul and qatayef for Eid and everyone asked where they were from. Authentic and delicious.",
    rating: 5,
  },
  {
    name: "Daniel R.",
    quote:
      "Perfect crust on the sourdough and the ordering was so easy. This is our new weekly ritual.",
    rating: 5,
  },
];

export const DEFAULT_MENU: Omit<MenuItem, "id">[] = [
  {
    slug: "crinkle-cookies",
    name: "Crinkle Cookies",
    description:
      "Rich, fudgy chocolate crinkles with a soft centre and a snowy powdered-sugar crackle.",
    image: "/images/crinkle-cookies.jpg",
    emoji: "🍪",
    sortOrder: 1,
    active: true,
    featured: true,
  },
  {
    slug: "chocolate-chip-cookies",
    name: "Chocolate Chip Cookies",
    description:
      "Golden, chewy cookies loaded with melty chocolate chips and a touch of sea salt.",
    image: "/images/chocolate-chip-cookies.jpg",
    emoji: "🍫",
    sortOrder: 2,
    active: true,
    featured: true,
  },
  {
    slug: "arab-desserts",
    name: "Arab Desserts",
    description:
      "Qatayef, Madlouka, and Maamoul — traditional sweets filled with cream and pistachio.",
    image: "/images/arab-desserts.jpg",
    emoji: "🥮",
    sortOrder: 3,
    active: true,
    featured: true,
  },
  {
    slug: "cheesecake",
    name: "Layali Lebnan Cheesecake",
    description:
      "A creamy Lebanese-style semolina cheesecake — light, fragrant, and delicately sweet.",
    image: null,
    emoji: "🍰",
    sortOrder: 4,
    active: true,
    featured: false,
  },
  {
    slug: "sourdough",
    name: "Sourdough Breads",
    description:
      "Naturally leavened artisan loaves with a crackling crust and an open, airy crumb.",
    image: "/images/sourdough.jpg",
    emoji: "🍞",
    sortOrder: 5,
    active: true,
    featured: true,
  },
];

export const DEFAULT_GALLERY: Omit<GalleryImage, "id">[] = [
  { src: "/images/crinkle-cookies.jpg", alt: "Chocolate crinkle cookies", sortOrder: 1 },
  { src: "/images/arab-desserts.jpg", alt: "Qatayef filled with pistachio cream", sortOrder: 2 },
  { src: "/images/madlouka.jpg", alt: "Pistachio madlouka", sortOrder: 3 },
  { src: "/images/chocolate-chip-cookies.jpg", alt: "Fresh chocolate chip cookie", sortOrder: 4 },
  { src: "/images/sourdough.jpg", alt: "Artisan sourdough loaf", sortOrder: 5 },
  { src: "/images/chocolate-sourdough.jpg", alt: "Chocolate sourdough loaf", sortOrder: 6 },
];

/** Default order-form questions (the "new/existing customer" question is intentionally omitted). */
export const DEFAULT_QUESTIONS: Omit<Question, "id">[] = [
  { qkey: "items", label: "What would you like to order?", type: "menu", options: [], required: true, role: "items", sortOrder: 1, active: true },
  { qkey: "allergies", label: "Any allergies?", type: "textarea", options: [], required: false, role: "none", sortOrder: 2, active: true },
  { qkey: "name", label: "Your name", type: "text", options: [], required: true, role: "name", sortOrder: 3, active: true },
  { qkey: "phone", label: "Phone number", type: "tel", options: [], required: true, role: "phone", sortOrder: 4, active: true },
  { qkey: "email", label: "E-mail", type: "email", options: [], required: false, role: "email", sortOrder: 5, active: true },
  { qkey: "contact_method", label: "Preferred contact method", type: "radio", options: ["Phone", "Email"], required: true, role: "none", sortOrder: 6, active: true },
  { qkey: "pickup_date", label: "Pickup date", type: "date", options: [], required: true, role: "date", sortOrder: 7, active: true },
  { qkey: "pickup_time", label: "Pickup time", type: "time", options: [], required: true, role: "time", sortOrder: 8, active: true },
  { qkey: "comments", label: "Questions and comments", type: "textarea", options: [], required: false, role: "none", sortOrder: 9, active: true },
];
