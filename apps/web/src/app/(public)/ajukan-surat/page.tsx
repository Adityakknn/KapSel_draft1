import type { Metadata } from "next";
import { Suspense } from "react";
import { AjukanSuratPage } from "@/components/public/AjukanSuratPage";

export const metadata: Metadata = {
  title: "Ajukan Surat",
  description:
    "Ajukan surat keterangan desa secara online. Isi formulir, dapatkan nomor permohonan, dan cek statusnya kapan saja.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-sm text-ink-muted">Memuat…</div>}>
      <AjukanSuratPage />
    </Suspense>
  );
}
