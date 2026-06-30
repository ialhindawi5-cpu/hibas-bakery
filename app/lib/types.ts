export type Settings = {
  siteName: string;
  orderEmail: string;
  contactEmail: string;
  phoneDisplay: string;
  phoneLink: string;
  instagram: string;
  instagramHandle: string;
  pickup: string;
  hours: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutBody: string;
  footerText: string;
};

export type MenuItem = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  emoji: string;
  sortOrder: number;
  active: boolean;
  featured: boolean;
};

export type GalleryImage = {
  id: number;
  src: string;
  alt: string;
  sortOrder: number;
};

export type QuestionType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "date"
  | "time"
  | "radio"
  | "checkbox"
  | "menu";

// A role lets the system map an answer to a known field (for display + email reply-to).
export type QuestionRole = "none" | "name" | "phone" | "email" | "date" | "time" | "items";

export type Question = {
  id: number;
  qkey: string;
  label: string;
  type: QuestionType;
  options: string[];
  required: boolean;
  role: QuestionRole;
  sortOrder: number;
  active: boolean;
};

export type OrderAnswer = { label: string; value: string };

export type Order = {
  id: number;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  pickupDate: string;
  pickupTime: string;
  answers: OrderAnswer[];
  status: "new" | "confirmed" | "completed" | "cancelled";
};
