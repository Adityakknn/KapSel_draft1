import type { Metadata } from "next";
import { Suspense } from "react";
import { CekStatusPage } from "@/components/public/CekStatusPage";

export const metadata: Metadata = {
  title: "Cek Status Permohonan",
  description: "Cek status permohonan surat keterangan Desa Sabah Balau menggunakan nomor permohonan Anda.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10 text-sm text-ink-muted">Memuat…</div>}>
      <CekStatusPage />
    </Suspense>
  );
}
