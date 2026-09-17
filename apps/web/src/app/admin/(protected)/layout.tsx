"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) {
      router.replace("/admin/login");
    }
  }, [loading, admin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-ink-muted">
        Memuat...
      </div>
    );
  }

  if (!admin) {
    // Sedang redirect ke /admin/login - hindari flash konten terproteksi.
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 px-8 py-8 bg-white">{children}</main>
      </div>
    </div>
  );
}
