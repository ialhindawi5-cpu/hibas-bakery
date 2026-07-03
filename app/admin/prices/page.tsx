import { redirect } from "next/navigation";

// Prices now live under Menu & Prices.
export default function AdminPricesPage() {
  redirect("/admin/menu");
}
