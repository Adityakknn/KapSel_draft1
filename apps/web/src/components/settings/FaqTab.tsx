"use client";

import { useState, type FormEvent } from "react";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { FaqEntry } from "@/lib/types";
import { Card } from "@/components/Card";

export function FaqTab() {
  const { data, loading, reload } = useApi(() => apiGet<FaqEntry[]>("/api/admin/settings/faq"));
  const [pertanyaan, setPertanyaan] = useState("");
  const [jawaban, setJawaban] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiPost("/api/admin/settings/faq", { pertanyaan, jawaban, urutan: (data?.length ?? 0) + 1 });
      setPertanyaan("");
      setJawaban("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah FAQ.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAktif(f: FaqEntry) {
    await apiPut(`/api/admin/settings/faq/${f.id}`, { aktif: !f.aktif });
    reload();
  }

  async function handleDelete(f: FaqEntry) {
    if (!confirm(`Hapus FAQ "${f.pertanyaan}"?`)) return;
    await apiDelete(`/api/admin/settings/faq/${f.id}`);
    reload();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        Ditampilkan chatbot WhatsApp saat warga memilih menu <em>Info Layanan</em>.
      </p>

      <Card className="divide-y divide-border">
        {loading && <p className="px-4 py-4 text-sm text-ink-muted">Memuat...</p>}
        {data?.map((f) => (
          <div key={f.id} className="px-4 py-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">{f.pertanyaan}</p>
              <p className="text-sm text-ink-muted mt-0.5">{f.jawaban}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => toggleAktif(f)}
                className={`text-xs rounded-full px-2.5 py-0.5 border ${
                  f.aktif ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-section text-ink-muted border-border"
                }`}
              >
                {f.aktif ? "Aktif" : "Nonaktif"}
              </button>
              <button onClick={() => handleDelete(f)} className="text-ink-muted hover:text-cardinal text-sm">
                Hapus
              </button>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-ink mb-3">Tambah FAQ</h3>
        {error && <p className="text-sm text-cardinal mb-2">{error}</p>}
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
            placeholder="Pertanyaan (contoh: Jam Pelayanan)"
            required
            className="w-full border border-border rounded-sm px-3 py-2 text-sm"
          />
          <textarea
            value={jawaban}
            onChange={(e) => setJawaban(e.target.value)}
            placeholder="Jawaban"
            required
            rows={2}
            className="w-full border border-border rounded-sm px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-cardinal hover:bg-cardinal-dark disabled:opacity-60 text-white text-sm font-medium rounded-sm px-4 py-2"
          >
            Tambah
          </button>
        </form>
      </Card>
    </div>
  );
}
