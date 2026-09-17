"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { PermohonanDetail } from "@/lib/types";
import { Card, PageHeading } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";

const FIELD_LABELS: Record<string, string> = {
  nama: "Nama Lengkap",
  nik: "NIK",
};

function labelFor(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export default function PermohonanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useApi(
    () => apiGet<PermohonanDetail>(`/api/admin/permohonan/${id}`),
    [id]
  );

  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState<"APPROVE" | "REJECT" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleVerifikasi(aksi: "APPROVE" | "REJECT") {
    setSubmitting(aksi);
    setActionError(null);
    try {
      const res = await apiPost<{ terkirimKeWarga: boolean }>(`/api/admin/permohonan/${id}/verifikasi`, {
        aksi,
        catatan: catatan || undefined,
      });
      setResult(
        aksi === "APPROVE"
          ? res.terkirimKeWarga
            ? "Disetujui dan surat sudah terkirim ke WhatsApp warga."
            : "Disetujui. Surat belum terkirim otomatis (bukan dari WA, atau bot sedang tidak aktif) - kirim manual ke warga."
          : "Permohonan ditolak."
      );
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Gagal memproses verifikasi.");
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">Memuat...</p>;
  if (error || !data) return <p className="text-sm text-cardinal">{error ?? "Permohonan tidak ditemukan."}</p>;

  const canVerify = data.status === "MENUNGGU_VERIFIKASI";

  return (
    <div>
      <Link href="/admin/permohonan" className="text-sm text-ink-muted hover:text-cardinal">
        ← Kembali ke daftar
      </Link>

      <div className="flex items-center justify-between mt-3 mb-6">
        <PageHeading title={data.nomorPermohonan} description={data.jenisSurat.nama} />
        <StatusBadge status={data.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2">
          <h2 className="font-serif text-lg font-semibold text-ink mb-4">Data Pemohon</h2>
          <dl className="space-y-3">
            {Object.entries(data.dataPemohon).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                <dt className="text-ink-muted">{labelFor(key)}</dt>
                <dd className="col-span-2 text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-border mt-6 pt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-ink-muted">Kanal</p>
              <p className="text-ink">{data.sumberKanal === "WHATSAPP" ? "WhatsApp" : "Website"}</p>
            </div>
            <div>
              <p className="text-ink-muted">Nomor WA Pemohon</p>
              <p className="text-ink">{data.nomorWaPemohon ?? "-"}</p>
            </div>
            <div>
              <p className="text-ink-muted">Diajukan</p>
              <p className="text-ink">{new Date(data.createdAt).toLocaleString("id-ID")}</p>
            </div>
            {data.diprosesOleh && (
              <div>
                <p className="text-ink-muted">Diproses Oleh</p>
                <p className="text-ink">{data.diprosesOleh.nama}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 h-fit">
          <h2 className="font-serif text-lg font-semibold text-ink mb-4">Verifikasi</h2>

          {result && <p className="text-sm bg-section rounded-sm px-3 py-2 mb-3">{result}</p>}
          {actionError && <p className="text-sm text-cardinal mb-3">{actionError}</p>}
          {data.catatanAdmin && !canVerify && (
            <p className="text-sm text-ink-muted mb-3">
              Catatan sebelumnya: <span className="text-ink">{data.catatanAdmin}</span>
            </p>
          )}

          {canVerify ? (
            <div className="space-y-3">
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan (opsional)"
                rows={3}
                className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/40"
              />
              <button
                onClick={() => handleVerifikasi("APPROVE")}
                disabled={submitting !== null}
                className="w-full bg-cardinal hover:bg-cardinal-dark disabled:opacity-60 text-white text-sm font-medium rounded-sm py-2.5"
              >
                {submitting === "APPROVE" ? "Memproses..." : "Setujui"}
              </button>
              <button
                onClick={() => handleVerifikasi("REJECT")}
                disabled={submitting !== null}
                className="w-full border border-border hover:bg-section disabled:opacity-60 text-ink text-sm font-medium rounded-sm py-2.5"
              >
                {submitting === "REJECT" ? "Memproses..." : "Tolak"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Permohonan ini sudah diproses, tidak bisa diubah lagi.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
