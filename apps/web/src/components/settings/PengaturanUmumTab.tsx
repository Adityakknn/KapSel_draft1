"use client";

import { useState, type FormEvent } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { PengaturanUmumEntry } from "@/lib/types";
import { Card } from "@/components/Card";

const KNOWN_KEYS: { key: string; label: string; placeholder: string }[] = [
  { key: "nama_kepala_desa", label: "Nama Kepala Desa", placeholder: "contoh: H. Ahmad Fulan" },
];

export function PengaturanUmumTab() {
  const { data, loading, reload } = useApi(() => apiGet<PengaturanUmumEntry[]>("/api/admin/settings/umum"));
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function valueFor(key: string): string {
    return data?.find((d) => d.key === key)?.value ?? "";
  }

  async function handleSave(e: FormEvent<HTMLFormElement>, key: string) {
    e.preventDefault();
    const value = (new FormData(e.currentTarget).get("value") as string) ?? "";
    setError(null);
    setSaving(key);
    try {
      await apiPut("/api/admin/settings/umum", { key, value });
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Nilai ini otomatis dipakai saat generate surat (mis. nama kepala desa untuk tanda tangan).
      </p>
      {error && <p className="text-sm text-cardinal">{error}</p>}

      {loading && <p className="text-sm text-ink-muted">Memuat...</p>}

      {KNOWN_KEYS.map((k) => (
        <Card key={k.key} className="p-5">
          <form onSubmit={(e) => handleSave(e, k.key)} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink mb-1">{k.label}</label>
              <input
                name="value"
                defaultValue={valueFor(k.key)}
                key={valueFor(k.key)}
                placeholder={k.placeholder}
                className="w-full border border-border rounded-sm px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving === k.key}
              className="bg-cardinal hover:bg-cardinal-dark disabled:opacity-60 text-white text-sm font-medium rounded-sm px-4 py-2"
            >
              Simpan
            </button>
          </form>
        </Card>
      ))}
    </div>
  );
}
