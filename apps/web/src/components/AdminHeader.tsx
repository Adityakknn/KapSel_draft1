"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AdminHeader() {
  const { admin, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/admin/login");
  }

  return (
    <header className="border-b border-border">
      <div className="border-t-2 border-cardinal" />
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="font-serif text-lg font-semibold text-ink leading-tight">E-Layan Desa</p>
          <p className="text-xs text-ink-muted">Dashboard Admin — Sabah Balau</p>
        </div>
        {admin && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-ink">{admin.nama}</p>
              <p className="text-xs text-ink-muted">{admin.peran === "SUPERADMIN" ? "Superadmin" : "Staf"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-ink-muted hover:text-cardinal border border-border rounded-sm px-3 py-1.5 transition-colors"
            >
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
