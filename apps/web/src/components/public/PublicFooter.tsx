import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-section text-sm text-ink-muted">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="mb-2 font-serif font-semibold text-ink">Pemerintah Desa Sabah Balau</p>
          <p>Kecamatan Tanjung Bintang, Kabupaten Lampung Selatan</p>
          {/* TODO: lengkapi alamat kantor desa (jalan, RT/RW, kode pos) yang sebenarnya */}
          <p className="mt-1 text-xs italic text-ink-muted/80">(TODO: alamat lengkap kantor desa)</p>
        </div>

        <div>
          <p className="mb-2 font-medium text-ink">Jam Pelayanan</p>
          <p>Senin–Jumat, 08.00–15.00 WIB</p>
          <p>(Istirahat 12.00–13.00 WIB)</p>
          <p>Sabtu, Minggu &amp; libur nasional: tutup</p>
        </div>

        <div>
          <p className="mb-2 font-medium text-ink">Kontak Resmi</p>
          {/* TODO: ganti dengan nomor telepon/kontak resmi kantor desa yang sebenarnya */}
          <p className="text-xs italic text-ink-muted/80">(TODO: nomor telepon kantor desa)</p>
          <p className="mt-2">
            Kanal alternatif: chatbot WhatsApp{" "}
            {/* TODO: ganti dengan nomor WhatsApp bot resmi desa */}
            <span className="text-xs italic text-ink-muted/80">(TODO: nomor WA bot)</span>
          </p>
          <Link href="/cek-status" className="mt-2 inline-block text-cardinal hover:underline">
            Cek status permohonan →
          </Link>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 text-center text-xs">
        Powered by Pemerintah Desa Sabah Balau — bagian dari sistem E-Layan Desa
      </div>
    </footer>
  );
}
