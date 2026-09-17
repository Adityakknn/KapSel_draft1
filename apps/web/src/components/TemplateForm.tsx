"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TipeField } from "shared/types";
import { apiPost, apiPut, ApiError } from "@/lib/api";
import type { JenisSuratAdmin, JenisSuratField } from "@/lib/types";
import { Card } from "@/components/Card";

const TIPE_OPTIONS: { value: TipeField; label: string }[] = [
  { value: "TEXT", label: "Teks singkat" },
  { value: "TEXTAREA", label: "Teks panjang" },
  { value: "NUMBER", label: "Angka" },
  { value: "DATE", label: "Tanggal (DD-MM-YYYY)" },
  { value: "NIK", label: "NIK (16 digit)" },
  { value: "TELEPON", label: "Nomor HP" },
  { value: "SELECT", label: "Pilihan (dropdown)" },
];

interface FieldRow {
  key: string;
  label: string;
  tipe: TipeField;
  wajib: boolean;
  urutan: number;
  opsi: string;
}

function fromExisting(fields: JenisSuratField[]): FieldRow[] {
  return fields
    .slice()
    .sort((a, b) => a.urutan - b.urutan)
    .map((f) => ({ key: f.key, label: f.label, tipe: f.tipe, wajib: f.wajib, urutan: f.urutan, opsi: f.opsi ?? "" }));
}

function emptyRow(urutan: number): FieldRow {
  return { key: "", label: "", tipe: "TEXT", wajib: true, urutan, opsi: "" };
}

export function TemplateForm({ existing }: { existing?: JenisSuratAdmin }) {
  const router = useRouter();
  const isEdit = Boolean(existing);

  const [kode, setKode] = useState(existing?.kode ?? "");
  const [nama, setNama] = useState(existing?.nama ?? "");
  const [deskripsi, setDeskripsi] = useState(existing?.deskripsi ?? "");
  const [fields, setFields] = useState<FieldRow[]>(
    existing ? fromExisting(existing.fields) : [emptyRow(1)]
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(index: number, patch: Partial<FieldRow>) {
    setFields((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addField() {
    setFields((rows) => [...rows, emptyRow(rows.length + 1)]);
  }

  function removeField(index: number) {
    setFields((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (fields.length === 0) {
      setError("Minimal 1 field harus didefinisikan.");
      return;
    }
    if (!isEdit && !file) {
      setError("File template .docx wajib diunggah.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      if (!isEdit) form.set("kode", kode);
      form.set("nama", nama);
      form.set("deskripsi", deskripsi);
      form.set(
        "fields",
        JSON.stringify(
          fields.map((f) => ({
            key: f.key,
            label: f.label,
            tipe: f.tipe,
            wajib: f.wajib,
            urutan: f.urutan,
            opsi: f.tipe === "SELECT" ? f.opsi : undefined,
          }))
        )
      );
      if (file) form.set("file", file);

      if (isEdit) {
        await apiPut(`/api/admin/templates/${existing!.id}`, form);
      } else {
        await apiPost("/api/admin/templates", form);
      }
      router.push("/admin/templates");
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = (err.details as { fields?: Record<string, string> } | undefined)?.fields;
        setError(fieldErrors ? `${err.message} ${JSON.stringify(fieldErrors)}` : err.message);
      } else {
        setError("Gagal menyimpan template.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-cardinal">{error}</p>}

      <Card className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Kode (slug)</label>
            <input
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              disabled={isEdit}
              placeholder="contoh: domisili"
              required
              className="w-full border border-border rounded-sm px-3 py-2 text-sm disabled:bg-section disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-cardinal/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nama Surat</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              placeholder="contoh: Surat Keterangan Domisili"
              className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/40"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Deskripsi</label>
          <input
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            File Template (.docx){isEdit ? " — kosongkan kalau tidak ganti" : ""}
          </label>
          <input
            type="file"
            accept=".docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          <p className="text-xs text-ink-muted mt-1">
            Placeholder di docx harus berformat <code>{"{namaField}"}</code>, cocok dengan kolom Key di bawah.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-ink">Field Formulir</h2>
          <button type="button" onClick={addField} className="text-sm text-cardinal hover:underline">
            + Tambah Field
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={i} className="border border-border rounded-sm p-3 grid md:grid-cols-12 gap-2 items-start">
              <input
                value={f.key}
                onChange={(e) => updateField(i, { key: e.target.value })}
                placeholder="key (contoh: nama)"
                required
                className="md:col-span-2 border border-border rounded-sm px-2 py-1.5 text-sm"
              />
              <input
                value={f.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                placeholder="Label ke warga"
                required
                className="md:col-span-3 border border-border rounded-sm px-2 py-1.5 text-sm"
              />
              <select
                value={f.tipe}
                onChange={(e) => updateField(i, { tipe: e.target.value as TipeField })}
                className="md:col-span-2 border border-border rounded-sm px-2 py-1.5 text-sm"
              >
                {TIPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {f.tipe === "SELECT" ? (
                <input
                  value={f.opsi}
                  onChange={(e) => updateField(i, { opsi: e.target.value })}
                  placeholder="Opsi dipisah | (mis. Laki-laki|Perempuan)"
                  className="md:col-span-3 border border-border rounded-sm px-2 py-1.5 text-sm"
                />
              ) : (
                <div className="md:col-span-3" />
              )}
              <input
                type="number"
                value={f.urutan}
                onChange={(e) => updateField(i, { urutan: Number(e.target.value) })}
                className="md:col-span-1 border border-border rounded-sm px-2 py-1.5 text-sm"
                title="Urutan"
              />
              <button
                type="button"
                onClick={() => removeField(i)}
                className="md:col-span-1 text-ink-muted hover:text-cardinal text-sm"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </Card>

      <button
        type="submit"
        disabled={submitting}
        className="bg-cardinal hover:bg-cardinal-dark disabled:opacity-60 text-white text-sm font-medium rounded-sm px-6 py-2.5"
      >
        {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Jenis Surat"}
      </button>
    </form>
  );
}
