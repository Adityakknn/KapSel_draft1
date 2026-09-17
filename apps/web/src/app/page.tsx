import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-section px-4 text-center">
      <p className="text-xs uppercase tracking-widest text-ink-muted mb-3">Desa Sabah Balau</p>
      <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink max-w-xl">
        E-Layan Desa
      </h1>
      <p className="text-ink-muted mt-3 max-w-md">
        Website layanan administrasi untuk warga sedang disiapkan. Sementara ini, ajukan &amp;
        cek surat lewat chatbot WhatsApp desa.
      </p>
      <Link
        href="/admin/login"
        className="mt-8 text-sm font-medium text-cardinal hover:underline"
      >
        Masuk sebagai perangkat desa →
      </Link>
    </main>
  );
}
