import { redirect } from "next/navigation";

// Logo & name now live under Settings.
export default function AdminBranding() {
  redirect("/admin/settings");
}
