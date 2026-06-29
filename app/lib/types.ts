export type Settings = {
  siteName: string;
  orderEmail: string;
  contactEmail: string;
  phoneDisplay: string;
  phoneLink: string;
  instagram: string;
  instagramHandle: string;
  pickup: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutBody: string;
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
};

export type GalleryImage = {
  id: number;
  src: string;
  alt: string;
  sortOrder: number;
};

export type Order = {
  id: number;
  createdAt: string;
  customerStatus: string;
  items: string[];
  allergies: string;
  name: string;
  phone: string;
  email: string;
  contactMethod: string;
  comments: string;
  pickupDate: string;
  pickupTime: string;
  status: "new" | "confirmed" | "completed" | "cancelled";
};
