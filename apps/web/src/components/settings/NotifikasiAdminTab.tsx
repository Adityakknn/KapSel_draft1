"use client";

import { useState, type FormEvent } from "react";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { NotifikasiAdminEntry } from "@/lib/types";
import { Card } from "@/components/Card";

export function NotifikasiAdminTab() {
  const { data, loading, reload } = useApi(() =>
    apiGet<NotifikasiAdminEntry[]>("/api/admin/settings/notifikasi-admin")
  );
  const [nama, setNama] = useState("");
  const [nomorWa, setNomorWa] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiPost("/api/admin/settings/notifikasi-admin", { nama, nomorWa });
      setNama("");
      setNomorWa("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah nomor.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAktif(n: NotifikasiAdminEntry) {
    await apiPut(`/api/admin/settings/notifikasi-admin/${n.id}`, { aktif: !n.aktif });
    reload();
  }

  async function handleDelete(n: NotifikasiAdminEntry) {
    if (!confirm(`Hapus nomor "${n.nama}" (${n.nomorWa})?`)) return;
    await apiDelete(`/api/admin/settings/notifikasi-admin/${n.id}`);
    reload();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        Nomor WA yang aktif akan menerima notifikasi otomatis setiap ada permohonan surat baru.
      </p>

      <Card className="divide-y divide-border">
        {loading && <p className="px-4 py-4 text-sm text-ink-muted">Memuat...</p>}
        {data?.length === 0 && <p className="px-4 py-4 text-sm text-ink-muted">Belum ada nomor terdaftar.</p>}
        {data?.map((n) => (
          <div key={n.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{n.nama}</p>
              <p className="text-sm text-ink-muted">{n.nomorWa}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleAktif(n)}
                className={`text-xs rounded-full px-2.5 py-0.5 border ${
                  n.aktif ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-section text-ink-muted border-border"
                }`}
              >
                {n.aktif ? "Aktif" : "Nonaktif"}
              </button>
              <button onClick={() => handleDelete(n)} className="text-ink-muted hover:text-cardinal text-sm">
                Hapus
              </button>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-ink mb-3">Tambah Nomor Admin</h3>
        {error && <p className="text-sm text-cardinal mb-2">{error}</p>}
        <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-3">
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama (contoh: Sekretaris Desa)"
            required
            className="border border-border rounded-sm px-3 py-2 text-sm"
          />
          <input
            value={nomorWa}
            onChange={(e) => setNomorWa(e.target.value)}
            placeholder="Nomor WA (08xxxxxxxxxx)"
            required
            className="border border-border rounded-sm px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-cardinal hover:bg-cardinal-dark disabled:opacity-60 text-white text-sm font-medium rounded-sm px-4 py-2 w-fit"
          >
            Tambah
          </button>
        </form>
      </Card>
    </div>
  );
}
