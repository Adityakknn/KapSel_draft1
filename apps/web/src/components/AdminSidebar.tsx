"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/permohonan", label: "Permohonan" },
  { href: "/admin/templates", label: "Template Surat" },
  { href: "/admin/settings", label: "Pengaturan" },
  { href: "/admin/activity-log", label: "Log Aktivitas" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-border bg-section px-3 py-6">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-cardinal text-white"
                    : "text-ink hover:bg-white hover:text-cardinal"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
