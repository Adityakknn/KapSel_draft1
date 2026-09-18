"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import { Card } from "@/components/Card";
import { StatusTimeline } from "@/components/public/StatusTimeline";
import type { PermohonanStatusPublik } from "@/lib/types";

const BUTTON_PRIMARY =
  "rounded-sm bg-cardinal px-5 py-2.5 text-sm font-medium text-white hover:bg-cardinal-dark disabled:opacity-60 disabled:cursor-not-allowed";

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function CekStatusPage() {
  const searchParams = useSearchParams();
  const [nomor, setNomor] = useState(searchParams.get("nomor") ?? "");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PermohonanStatusPublik | null>(null);

  async function cariStatus(nomorDicari: string) {
    const trimmed = nomorDicari.trim();
    if (!trimmed) return;

    setLoading(true);
    setNotFound(false);
    setErrorMsg(null);
    setResult(null);

    try {
      const data = await apiGet<PermohonanStatusPublik>(`/api/permohonan/${encodeURIComponent(trimmed.toUpperCase())}`);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Sedang ada gangguan koneksi ke server. Silakan coba lagi beberapa saat lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Auto-cari kalau datang dari link "Cek Status Sekarang" setelah submit di halaman Ajukan Surat.
  useEffect(() => {
    const prefill = searchParams.get("nomor");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState di sini memicu fetch async, bukan render loop
    if (prefill) cariStatus(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    cariStatus(nomor);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-2xl font-semibold text-ink md:text-3xl">Cek Status Permohonan</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Masukkan nomor permohonan yang Anda dapatkan saat mengajukan surat.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor="nomor-permohonan" className="sr-only">
            Nomor Permohonan
          </label>
          <input
            id="nomor-permohonan"
            type="text"
            value={nomor}
            onChange={(e) => setNomor(e.target.value)}
            placeholder="Contoh: PENGANTAR-20260917-0001"
            className="w-full rounded-sm border border-border px-3 py-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-ink-muted">
            Format: KODE-JENIS-TANGGAL-URUTAN, sesuai yang tertera saat pengajuan.
          </p>
        </div>
        <button type="submit" disabled={loading || !nomor.trim()} className={BUTTON_PRIMARY}>
          {loading ? "Mencari…" : "Cek Status"}
        </button>
      </form>

      {notFound && (
        <div className="mt-6 rounded-sm border border-cardinal/20 bg-cardinal/5 px-4 py-4">
          <p className="text-sm text-cardinal">
            Nomor permohonan tidak ditemukan. Periksa kembali penulisan nomornya, atau hubungi kantor desa
            jika Anda yakin nomor sudah benar.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="mt-6 rounded-sm border border-cardinal/20 bg-cardinal/5 px-4 py-4">
          <p className="text-sm text-cardinal">{errorMsg}</p>
        </div>
      )}

      {result && (
        <Card className="mt-8 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs text-ink-muted">Nomor Permohonan</p>
              <p className="font-serif text-lg font-semibold text-ink">{result.nomorPermohonan}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-muted">Jenis Surat</p>
              <p className="text-sm font-medium text-ink">{result.jenisSurat}</p>
            </div>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Diajukan pada {formatTanggal(result.diajukanPada)}</p>

          <div className="mt-8 overflow-x-auto">
            <StatusTimeline status={result.status} />
          </div>

          {result.status === "MENUNGGU_VERIFIKASI" && (
            <p className="mt-6 rounded-sm bg-section px-4 py-3 text-sm text-ink-muted">
              Permohonan Anda sedang menunggu verifikasi perangkat desa. Umumnya proses selesai dalam 1–3
              hari kerja (Senin–Jumat, 08.00–15.00 WIB) setelah diverifikasi. Jika sudah lebih lama dari itu,
              silakan hubungi kantor desa (lihat kontak di bagian bawah halaman).
            </p>
          )}

          {result.status === "DITOLAK" && (
            <div className="mt-6 rounded-sm border border-cardinal/20 bg-cardinal/5 px-4 py-3">
              <p className="text-sm font-medium text-cardinal">Permohonan ini ditolak.</p>
              <p className="mt-1 text-sm text-ink-muted">
                {result.catatanAdmin?.trim()
                  ? result.catatanAdmin
                  : "Hubungi kantor desa untuk mengetahui alasan penolakan dan langkah selanjutnya."}
              </p>
            </div>
          )}

          {result.status === "SELESAI" && (
            <p className="mt-6 rounded-sm bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Surat Anda sudah selesai diproses. Silakan datang ke kantor desa untuk mengambil surat, atau
              hubungi kantor desa jika sudah diatur pengiriman lain.
            </p>
          )}

          {result.status === "DISETUJUI" && result.catatanAdmin?.trim() && (
            <p className="mt-6 rounded-sm bg-section px-4 py-3 text-sm text-ink-muted">
              Catatan admin: {result.catatanAdmin}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
