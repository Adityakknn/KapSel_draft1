"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/ajukan-surat", label: "Ajukan Surat" },
  { href: "/cek-status", label: "Cek Status" },
];

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* TODO: ganti monogram placeholder ini dengan logo resmi Desa Sabah Balau */}
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cardinal font-serif text-sm font-semibold text-white"
          >
            SB
          </span>
          <span className="font-serif text-base font-semibold leading-tight text-ink">
            <span className="hidden sm:inline">E-Layan Desa Sabah Balau</span>
            <span className="sm:hidden">E-Layan Desa</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 pb-1 transition-colors ${
                  active
                    ? "border-cardinal text-cardinal"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
