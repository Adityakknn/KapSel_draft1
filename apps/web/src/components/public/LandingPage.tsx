"use client";

import Link from "next/link";
import type { JenisSuratDTO } from "shared/types";
import { apiGet } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Card } from "@/components/Card";
import { WorkflowStepper } from "@/components/public/WorkflowStepper";

export function LandingPage() {
  const { data: daftarSurat, loading, error, reload } = useApi(() =>
    apiGet<JenisSuratDTO[]>("/api/jenis-surat")
  );

  return (
    <>
      <section className="bg-section px-4 py-16 text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-cardinal">
          Layanan Resmi Desa Sabah Balau
        </p>
        <h1 className="mx-auto max-w-2xl font-serif text-3xl font-semibold text-ink md:text-4xl">
          Urus Surat Keterangan Desa, Tanpa Antre di Kantor
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-muted">
          Ajukan surat keterangan secara online, dapatkan nomor permohonan, dan pantau statusnya
          kapan saja — surat tetap diperiksa dan disahkan langsung oleh perangkat desa.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/ajukan-surat"
            className="rounded-sm bg-cardinal px-6 py-3 text-sm font-medium text-white hover:bg-cardinal-dark"
          >
            Ajukan Surat Sekarang
          </Link>
          <Link
            href="/cek-status"
            className="rounded-sm border border-border bg-white px-6 py-3 text-sm font-medium text-ink hover:bg-section"
          >
            Cek Status Permohonan
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center font-serif text-2xl font-semibold text-ink">Jenis Surat yang Tersedia</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-muted">
          Daftar berikut selalu mengikuti layanan yang sedang aktif di desa.
        </p>

        {loading && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-sm border border-border bg-section" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-sm border border-cardinal/20 bg-cardinal/5 px-4 py-6 text-center">
            <p className="text-sm text-cardinal">
              Daftar jenis surat sedang tidak bisa dimuat. Coba lagi beberapa saat lagi.
            </p>
            <button
              onClick={reload}
              className="mt-3 rounded-sm border border-cardinal/30 px-4 py-1.5 text-sm font-medium text-cardinal hover:bg-cardinal/10"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && daftarSurat && daftarSurat.length === 0 && (
          <p className="mt-8 text-center text-sm text-ink-muted">
            Belum ada jenis surat yang aktif saat ini. Silakan hubungi kantor desa.
          </p>
        )}

        {!loading && !error && daftarSurat && daftarSurat.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {daftarSurat.map((js) => (
              <Card key={js.kode} className="flex flex-col p-5">
                <p className="font-serif font-semibold text-ink">{js.nama}</p>
                {js.deskripsi && <p className="mt-2 flex-1 text-sm text-ink-muted">{js.deskripsi}</p>}
                <Link
                  href={`/ajukan-surat?jenis=${encodeURIComponent(js.kode)}`}
                  className="mt-4 text-sm font-medium text-cardinal hover:underline"
                >
                  Ajukan surat ini →
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="bg-section px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-serif text-2xl font-semibold text-ink">Bagaimana Prosesnya?</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-muted">
            Setiap permohonan melalui tahapan ini sebelum surat resmi diterbitkan.
          </p>
          <div className="mt-10">
            <WorkflowStepper />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-cardinal">Kanal Alternatif</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">Lebih Suka Lewat WhatsApp?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
          Anda juga bisa mengajukan surat dan mengecek status permohonan langsung lewat chatbot
          WhatsApp resmi desa, tanpa perlu membuka website.
        </p>
        {/* TODO: ganti href dengan link wa.me/<nomor bot resmi> setelah nomor WA bot desa ditetapkan */}
        <p className="mt-6 text-sm italic text-ink-muted/80">
          (TODO: nomor WhatsApp bot resmi desa — tautan mulai chat akan tampil di sini)
        </p>
      </section>
    </>
  );
}
