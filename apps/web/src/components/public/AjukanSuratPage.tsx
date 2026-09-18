"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { JenisSuratDTO, JenisSuratFieldDTO } from "shared/types";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { validateByFieldTypeClient, validatePhoneClient } from "@/lib/fieldValidation";
import { Card } from "@/components/Card";
import type { SubmitPermohonanResponse } from "@/lib/types";

type Step = "pilih" | "isi" | "konfirmasi" | "sukses";

const BUTTON_PRIMARY =
  "rounded-sm bg-cardinal px-5 py-2.5 text-sm font-medium text-white hover:bg-cardinal-dark disabled:opacity-60 disabled:cursor-not-allowed";
const BUTTON_SECONDARY =
  "rounded-sm border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-section disabled:opacity-60";

function inputTypeFor(field: JenisSuratFieldDTO): string {
  switch (field.tipe) {
    case "NUMBER":
      return "text";
    case "TELEPON":
      return "tel";
    default:
      return "text";
  }
}

function helperTextFor(field: JenisSuratFieldDTO): string | null {
  switch (field.tipe) {
    case "NIK":
      return "16 digit angka, tanpa spasi.";
    case "DATE":
      return "Format: DD-MM-YYYY, contoh: 17-09-2026.";
    case "TELEPON":
      return "Contoh: 08xxxxxxxxxx atau +628xxxxxxxxxx.";
    default:
      return null;
  }
}

export function AjukanSuratPage() {
  const searchParams = useSearchParams();
  const prefillKode = searchParams.get("jenis");

  const { data: daftarSurat, loading: loadingDaftar, error: errorDaftar, reload } = useApi(() =>
    apiGet<JenisSuratDTO[]>("/api/jenis-surat")
  );

  const [step, setStep] = useState<Step>("pilih");
  const [selectedKode, setSelectedKode] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [kontakWa, setKontakWa] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [kontakWaError, setKontakWaError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SubmitPermohonanResponse | null>(null);

  const selected = useMemo(
    () => daftarSurat?.find((j) => j.kode === selectedKode) ?? null,
    [daftarSurat, selectedKode]
  );

  // Prefill dari link "Ajukan surat ini" di landing page / daftar jenis surat.
  useEffect(() => {
    if (prefillKode && daftarSurat && step === "pilih") {
      const match = daftarSurat.find((j) => j.kode === prefillKode);
      if (match) handleSelectJenis(match.kode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillKode, daftarSurat]);

  function handleSelectJenis(kode: string) {
    setSelectedKode(kode);
    setFormData({});
    setFieldErrors({});
    setTouched({});
    setKontakWa("");
    setKontakWaError(null);
    setSubmitError(null);
    setStep("isi");
  }

  function validateField(field: JenisSuratFieldDTO, value: string): string | null {
    if (!value.trim()) {
      return field.wajib ? `${field.label} wajib diisi.` : null;
    }
    const result = validateByFieldTypeClient(field.tipe, value, { label: field.label, options: field.opsi });
    return result.valid ? null : result.error ?? null;
  }

  function handleFieldChange(field: JenisSuratFieldDTO, value: string) {
    setFormData((prev) => ({ ...prev, [field.key]: value }));
    if (touched[field.key]) {
      const error = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field.key]: error ?? "" }));
    }
  }

  function handleFieldBlur(field: JenisSuratFieldDTO) {
    setTouched((prev) => ({ ...prev, [field.key]: true }));
    const error = validateField(field, formData[field.key] ?? "");
    setFieldErrors((prev) => ({ ...prev, [field.key]: error ?? "" }));
  }

  function handleKontakWaBlur() {
    if (!kontakWa.trim()) {
      setKontakWaError(null);
      return;
    }
    const result = validatePhoneClient(kontakWa);
    setKontakWaError(result.valid ? null : result.error ?? null);
  }

  function handleLanjutKonfirmasi() {
    if (!selected) return;
    const errors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    for (const field of selected.fields) {
      allTouched[field.key] = true;
      const error = validateField(field, formData[field.key] ?? "");
      if (error) errors[field.key] = error;
    }
    setTouched(allTouched);
    setFieldErrors(errors);

    let kontakOk = true;
    if (kontakWa.trim()) {
      const result = validatePhoneClient(kontakWa);
      if (!result.valid) {
        setKontakWaError(result.error ?? null);
        kontakOk = false;
      }
    }

    if (Object.keys(errors).length === 0 && kontakOk) {
      setSubmitError(null);
      setStep("konfirmasi");
    }
  }

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await apiPost<SubmitPermohonanResponse>("/api/permohonan", {
        jenisSuratKode: selected.kode,
        data: formData,
        kontakWa: kontakWa.trim() || undefined,
      });
      setSuccessData(result);
      setStep("sukses");
    } catch (err) {
      if (err instanceof ApiError) {
        const details = err.details as { fields?: Record<string, string> } | undefined;
        if (details?.fields) {
          setFieldErrors((prev) => ({ ...prev, ...details.fields }));
          setSubmitError("Ada isian yang perlu diperbaiki. Silakan periksa kembali data Anda.");
          setStep("isi");
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError("Sedang ada gangguan koneksi ke server. Silakan coba lagi beberapa saat lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleAjukanLagi() {
    setStep("pilih");
    setSelectedKode(null);
    setFormData({});
    setFieldErrors({});
    setTouched({});
    setKontakWa("");
    setKontakWaError(null);
    setSuccessData(null);
    setSubmitError(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-2xl font-semibold text-ink md:text-3xl">Ajukan Surat</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Isi formulir berikut untuk mengajukan surat keterangan dari Desa Sabah Balau.
      </p>

      {step !== "sukses" && (
        <ol className="mt-6 flex gap-6 text-xs font-medium text-ink-muted">
          <li className={step === "pilih" ? "text-cardinal" : undefined}>1. Pilih Jenis Surat</li>
          <li className={step === "isi" ? "text-cardinal" : undefined}>2. Isi Data</li>
          <li className={step === "konfirmasi" ? "text-cardinal" : undefined}>3. Konfirmasi &amp; Kirim</li>
        </ol>
      )}

      {step === "pilih" && (
        <div className="mt-8">
          {loadingDaftar && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-sm border border-border bg-section" />
              ))}
            </div>
          )}

          {!loadingDaftar && errorDaftar && (
            <div className="rounded-sm border border-cardinal/20 bg-cardinal/5 px-4 py-6 text-center">
              <p className="text-sm text-cardinal">Daftar jenis surat sedang tidak bisa dimuat.</p>
              <button onClick={reload} className={`${BUTTON_SECONDARY} mt-3`}>
                Coba Lagi
              </button>
            </div>
          )}

          {!loadingDaftar && !errorDaftar && daftarSurat && daftarSurat.length === 0 && (
            <p className="text-sm text-ink-muted">
              Belum ada jenis surat yang aktif saat ini. Silakan hubungi kantor desa.
            </p>
          )}

          {!loadingDaftar && !errorDaftar && daftarSurat && daftarSurat.length > 0 && (
            <div className="space-y-3">
              {daftarSurat.map((js) => (
                <button
                  key={js.kode}
                  onClick={() => handleSelectJenis(js.kode)}
                  className="block w-full text-left"
                >
                  <Card className="p-4 hover:border-cardinal/40">
                    <p className="font-medium text-ink">{js.nama}</p>
                    {js.deskripsi && <p className="mt-1 text-sm text-ink-muted">{js.deskripsi}</p>}
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "isi" && selected && (
        <div className="mt-8">
          <p className="text-sm text-ink-muted">
            Mengajukan: <span className="font-medium text-ink">{selected.nama}</span>
          </p>

          {submitError && (
            <div className="mt-4 rounded-sm border border-cardinal/20 bg-cardinal/5 px-4 py-3">
              <p className="text-sm text-cardinal">{submitError}</p>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {[...selected.fields]
              .sort((a, b) => a.urutan - b.urutan)
              .map((field) => {
                const value = formData[field.key] ?? "";
                const error = touched[field.key] ? fieldErrors[field.key] : undefined;
                const helper = helperTextFor(field);

                return (
                  <div key={field.key}>
                    <label htmlFor={`field-${field.key}`} className="block text-sm font-medium text-ink">
                      {field.label}
                      {field.wajib && <span className="text-cardinal"> *</span>}
                    </label>

                    {field.tipe === "TEXTAREA" ? (
                      <textarea
                        id={`field-${field.key}`}
                        value={value}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        onBlur={() => handleFieldBlur(field)}
                        rows={3}
                        aria-invalid={!!error}
                        aria-describedby={error ? `field-${field.key}-error` : undefined}
                        className={`mt-1 w-full rounded-sm border px-3 py-2 text-sm ${
                          error ? "border-cardinal" : "border-border"
                        }`}
                      />
                    ) : field.tipe === "SELECT" ? (
                      <select
                        id={`field-${field.key}`}
                        value={value}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        onBlur={() => handleFieldBlur(field)}
                        aria-invalid={!!error}
                        aria-describedby={error ? `field-${field.key}-error` : undefined}
                        className={`mt-1 w-full rounded-sm border bg-white px-3 py-2 text-sm ${
                          error ? "border-cardinal" : "border-border"
                        }`}
                      >
                        <option value="">-- Pilih --</option>
                        {(field.opsi ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`field-${field.key}`}
                        type={inputTypeFor(field)}
                        inputMode={field.tipe === "NIK" || field.tipe === "NUMBER" ? "numeric" : undefined}
                        maxLength={field.tipe === "NIK" ? 16 : undefined}
                        value={value}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        onBlur={() => handleFieldBlur(field)}
                        aria-invalid={!!error}
                        aria-describedby={error ? `field-${field.key}-error` : undefined}
                        className={`mt-1 w-full rounded-sm border px-3 py-2 text-sm ${
                          error ? "border-cardinal" : "border-border"
                        }`}
                      />
                    )}

                    {error ? (
                      <p id={`field-${field.key}-error`} className="mt-1 text-xs text-cardinal">
                        {error}
                      </p>
                    ) : (
                      helper && <p className="mt-1 text-xs text-ink-muted">{helper}</p>
                    )}
                  </div>
                );
              })}

            <div>
              <label htmlFor="kontak-wa" className="block text-sm font-medium text-ink">
                Nomor WhatsApp (opsional)
              </label>
              <input
                id="kontak-wa"
                type="tel"
                value={kontakWa}
                onChange={(e) => setKontakWa(e.target.value)}
                onBlur={handleKontakWaBlur}
                aria-invalid={!!kontakWaError}
                aria-describedby={kontakWaError ? "kontak-wa-error" : "kontak-wa-helper"}
                className={`mt-1 w-full rounded-sm border px-3 py-2 text-sm ${
                  kontakWaError ? "border-cardinal" : "border-border"
                }`}
              />
              {kontakWaError ? (
                <p id="kontak-wa-error" className="mt-1 text-xs text-cardinal">
                  {kontakWaError}
                </p>
              ) : (
                <p id="kontak-wa-helper" className="mt-1 text-xs text-ink-muted">
                  Isi jika ingin menerima info status lewat WhatsApp. Contoh: 08xxxxxxxxxx.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep("pilih")} className={BUTTON_SECONDARY}>
              ← Ganti Jenis Surat
            </button>
            <button onClick={handleLanjutKonfirmasi} className={BUTTON_PRIMARY}>
              Lanjut ke Konfirmasi
            </button>
          </div>
        </div>
      )}

      {step === "konfirmasi" && selected && (
        <div className="mt-8">
          <p className="text-sm text-ink-muted">Periksa kembali data Anda sebelum mengirim permohonan.</p>

          {submitError && (
            <div className="mt-4 rounded-sm border border-cardinal/20 bg-cardinal/5 px-4 py-3">
              <p className="text-sm text-cardinal">{submitError}</p>
            </div>
          )}

          <Card className="mt-4 divide-y divide-border">
            <div className="px-4 py-3">
              <p className="text-xs text-ink-muted">Jenis Surat</p>
              <p className="text-sm font-medium text-ink">{selected.nama}</p>
            </div>
            {[...selected.fields]
              .sort((a, b) => a.urutan - b.urutan)
              .map((field) => (
                <div key={field.key} className="px-4 py-3">
                  <p className="text-xs text-ink-muted">{field.label}</p>
                  <p className="whitespace-pre-wrap text-sm text-ink">
                    {formData[field.key]?.trim() || <span className="italic text-ink-muted">Tidak diisi</span>}
                  </p>
                </div>
              ))}
            <div className="px-4 py-3">
              <p className="text-xs text-ink-muted">Nomor WhatsApp</p>
              <p className="text-sm text-ink">
                {kontakWa.trim() || <span className="italic text-ink-muted">Tidak diisi</span>}
              </p>
            </div>
          </Card>

          <p className="mt-3 text-xs text-ink-muted">
            Pastikan data sudah benar. Jika ada kesalahan setelah dikirim, hubungi kantor desa untuk perbaikan.
          </p>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep("isi")} disabled={submitting} className={BUTTON_SECONDARY}>
              ← Kembali, Edit Data
            </button>
            <button onClick={handleSubmit} disabled={submitting} className={BUTTON_PRIMARY}>
              {submitting ? "Mengirim…" : "Kirim Permohonan"}
            </button>
          </div>
        </div>
      )}

      {step === "sukses" && successData && (
        <div className="mt-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-emerald-600" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="mt-4 font-serif text-xl font-semibold text-ink">Permohonan Berhasil Dikirim</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Simpan nomor permohonan di bawah ini untuk mengecek status.
          </p>

          <Card className="mx-auto mt-6 max-w-sm border-cardinal/30 bg-cardinal/5 p-6">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Nomor Permohonan</p>
            <p className="mt-1 select-all break-all font-serif text-2xl font-bold text-cardinal">
              {successData.nomorPermohonan}
            </p>
          </Card>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/cek-status?nomor=${encodeURIComponent(successData.nomorPermohonan)}`}
              className={BUTTON_PRIMARY}
            >
              Cek Status Sekarang
            </Link>
            <button onClick={handleAjukanLagi} className={BUTTON_SECONDARY}>
              Ajukan Surat Lain
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
