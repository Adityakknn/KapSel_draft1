"use client";

import Link from "next/link";
import type { StatusPermohonan } from "shared/types";
import { apiGet } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Card, PageHeading } from "@/components/Card";

type Ringkasan = Record<StatusPermohonan, number>;

const STAT_CONFIG: { key: StatusPermohonan; label: string }[] = [
  { key: "MENUNGGU_VERIFIKASI", label: "Menunggu Verifikasi" },
  { key: "DISETUJUI", label: "Disetujui" },
  { key: "SELESAI", label: "Selesai" },
  { key: "DITOLAK", label: "Ditolak" },
];

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi(() => apiGet<Ringkasan>("/api/admin/permohonan/ringkasan"));

  return (
    <div>
      <PageHeading
        title="Dashboard"
        description="Ringkasan permohonan surat masuk dari WhatsApp maupun website."
      />

      {error && <p className="text-sm text-cardinal mb-4">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STAT_CONFIG.map((stat) => (
          <Card key={stat.key} className="p-5">
            <p className="text-xs text-ink-muted uppercase tracking-wide">{stat.label}</p>
            <p className="font-serif text-3xl font-semibold text-ink mt-2">
              {loading ? "–" : (data?.[stat.key] ?? 0)}
            </p>
          </Card>
        ))}
      </div>

      {!loading && data && data.MENUNGGU_VERIFIKASI > 0 && (
        <Card className="p-5 flex items-center justify-between">
          <p className="text-sm text-ink">
            Ada <strong>{data.MENUNGGU_VERIFIKASI}</strong> permohonan yang menunggu verifikasi.
          </p>
          <Link
            href="/admin/permohonan?status=MENUNGGU_VERIFIKASI"
            className="text-sm font-medium text-cardinal hover:underline"
          >
            Proses sekarang →
          </Link>
        </Card>
      )}
    </div>
  );
}
