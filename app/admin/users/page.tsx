import { redirect } from "next/navigation";

// Admin users now live under Settings.
export default function AdminUsersPage() {
  redirect("/admin/settings");
}
