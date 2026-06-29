"use client";

import "./admin.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/orders", label: "Orders", icon: "📋" },
  { href: "/admin/menu", label: "Menu", icon: "🧁" },
  { href: "/admin/questions", label: "Order Form", icon: "📝" },
  { href: "/admin/settings", label: "Settings & Logo", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">
          Bakery
          <span>Admin Dashboard</span>
        </div>
        <nav>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={pathname.startsWith(n.href) ? "active" : ""}
            >
              {n.icon} {n.label}
            </Link>
          ))}
        </nav>
        <div className="admin-side-foot">
          <a href="/" target="_blank" rel="noopener noreferrer">
            ↗ View website
          </a>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
