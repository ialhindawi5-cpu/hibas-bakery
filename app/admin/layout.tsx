"use client";

import "./admin.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/home", label: "Home Page" },
  { href: "/admin/about", label: "About Page" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/questions", label: "Order Form" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/branding", label: "Logo & Name" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Admin Users" },
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
              {n.label}
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
