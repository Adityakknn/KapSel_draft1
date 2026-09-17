"use client";

import Link from "next/link";
import { apiGet, apiPut, apiDelete, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { JenisSuratAdmin } from "@/lib/types";
import { Card, PageHeading } from "@/components/Card";
import { useState } from "react";

export default function TemplatesListPage() {
  const { data, loading, error, reload } = useApi(() => apiGet<JenisSuratAdmin[]>("/api/admin/templates"));
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggleAktif(t: JenisSuratAdmin) {
    setActionError(null);
    try {
      const form = new FormData();
      form.set("aktif", String(!t.aktif));
      await apiPut(`/api/admin/templates/${t.id}`, form);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Gagal mengubah status.");
    }
  }

  async function handleDelete(t: JenisSuratAdmin) {
    if (!confirm(`Hapus jenis surat "${t.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setActionError(null);
    try {
      await apiDelete(`/api/admin/templates/${t.id}`);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Gagal menghapus.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeading title="Template Surat" description="Kelola jenis surat, field, dan file template .docx." />
        <Link
          href="/admin/templates/new"
          className="bg-cardinal hover:bg-cardinal-dark text-white text-sm font-medium rounded-sm px-4 py-2 h-fit"
        >
          + Tambah Jenis Surat
        </Link>
      </div>

      {error && <p className="text-sm text-cardinal mb-4">{error}</p>}
      {actionError && <p className="text-sm text-cardinal mb-4">{actionError}</p>}

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-muted">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Kode</th>
              <th className="px-4 py-3 font-medium">Field</th>
              <th className="px-4 py-3 font-medium">Permohonan</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
            {data?.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-section/60">
                <td className="px-4 py-3 font-medium text-ink">{t.nama}</td>
                <td className="px-4 py-3 text-ink-muted font-mono text-xs">{t.kode}</td>
                <td className="px-4 py-3">{t.fields.length}</td>
                <td className="px-4 py-3">{t._count.permohonan}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAktif(t)}
                    className={`text-xs rounded-full px-2.5 py-0.5 border ${
                      t.aktif
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-section text-ink-muted border-border"
                    }`}
                  >
                    {t.aktif ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link href={`/admin/templates/${t.id}`} className="text-cardinal hover:underline font-medium">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={t._count.permohonan > 0}
                    title={t._count.permohonan > 0 ? "Sudah dipakai di permohonan, nonaktifkan saja" : ""}
                    className="text-ink-muted hover:text-cardinal disabled:opacity-30 disabled:hover:text-ink-muted"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
