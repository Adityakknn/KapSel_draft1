"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { StatusPermohonan } from "shared/types";
import { apiGet } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { PermohonanListResponse } from "@/lib/types";
import { Card, PageHeading } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";

const STATUS_OPTIONS: { value: StatusPermohonan | ""; label: string }[] = [
  { value: "", label: "Semua Status" },
  { value: "MENUNGGU_VERIFIKASI", label: "Menunggu Verifikasi" },
  { value: "DISETUJUI", label: "Disetujui" },
  { value: "DITOLAK", label: "Ditolak" },
  { value: "SELESAI", label: "Selesai" },
];

export default function PermohonanListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);

  const status = searchParams.get("status") ?? "";

  const { data, loading, error, reload } = useApi(() => {
    const qs = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) qs.set("status", status);
    return apiGet<PermohonanListResponse>(`/api/admin/permohonan?${qs.toString()}`);
  }, [status, page]);

  function updateStatus(next: string) {
    setPage(1);
    const qs = new URLSearchParams(searchParams.toString());
    if (next) qs.set("status", next);
    else qs.delete("status");
    router.push(`/admin/permohonan?${qs.toString()}`);
  }

  return (
    <div>
      <PageHeading title="Permohonan Surat" description="Semua permohonan dari WhatsApp maupun website." />

      <div className="flex items-center justify-between mb-4">
        <select
          value={status}
          onChange={(e) => updateStatus(e.target.value)}
          className="border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/40"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button onClick={reload} className="text-sm text-ink-muted hover:text-cardinal">
          Muat ulang
        </button>
      </div>

      {error && <p className="text-sm text-cardinal mb-4">{error}</p>}

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-muted">
              <th className="px-4 py-3 font-medium">Nomor Permohonan</th>
              <th className="px-4 py-3 font-medium">Jenis Surat</th>
              <th className="px-4 py-3 font-medium">Kanal</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Diajukan</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                  Tidak ada permohonan.
                </td>
              </tr>
            )}
            {data?.items.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-section/60">
                <td className="px-4 py-3 font-medium text-ink">{p.nomorPermohonan}</td>
                <td className="px-4 py-3">{p.jenisSurat.nama}</td>
                <td className="px-4 py-3 text-ink-muted">{p.sumberKanal === "WHATSAPP" ? "WhatsApp" : "Website"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/permohonan/${p.id}`} className="text-cardinal hover:underline font-medium">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-ink-muted">
          <span>
            Halaman {data.pagination.page} dari {data.pagination.totalPages} ({data.pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border border-border rounded-sm px-3 py-1.5 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border border-border rounded-sm px-3 py-1.5 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
