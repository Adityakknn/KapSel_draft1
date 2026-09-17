# E-Layan Desa — Sabah Balau

Sistem terpadu layanan administrasi digital Desa Sabah Balau, Kec. Tanjung Bintang,
Lampung Selatan: chatbot WhatsApp, backend API, website publik, dan dashboard admin.
Dikerjakan untuk mata kuliah Kapita Selekta Informatika ITERA.

Prinsip utama: teknologi membantu pekerjaan administratif, tapi keputusan/kewenangan
akhir tetap di tangan aparatur desa — surat yang di-generate wajib melalui verifikasi
perangkat desa sebelum dikirim ke warga.

## Struktur

- `apps/wa-bot` — chatbot WhatsApp (Baileys) — lihat `apps/wa-bot/README.md`
- `apps/api` — backend Express, satu-satunya pintu ke database — lihat `apps/api/README.md`
- `apps/web` — Dashboard Admin (`/admin/*`) & Website Publik (Next.js) — lihat `apps/web/README.md`
- `packages/shared` — skema Prisma, tipe TypeScript, util validasi & generate surat bersama
  (dipakai `wa-bot` maupun `api`, tidak diduplikasi) — lihat `packages/shared/README.md`
- `templates` — file `.docx` template surat (placeholder `{tag}` diisi docxtemplater)
- `storage/` (di-gitignore) — draft surat hasil generate, dibuat otomatis saat runtime

## Arsitektur

Satu Supabase project untuk semua bagian. `wa-bot` dan `api` konek langsung ke Postgres lewat
Prisma memakai role `postgres` (setara service role) — **tidak pernah** dari browser/frontend.
Row Level Security aktif di semua tabel sebagai lapisan pertahanan tambahan (lihat migration
`enable_rls` di `packages/shared/prisma/migrations`). `apps/web` (Next.js) hanya bicara ke
`apps/api` lewat HTTP + cookie sesi, tidak pernah langsung ke Supabase.

`wa-bot` dan `api` saling terhubung lewat server internal kecil di `wa-bot`
(`apps/wa-bot/src/internal/server.ts`, localhost-only + shared secret) — dipakai `api` untuk
memicu notifikasi/pengiriman WA saat ada pengajuan dari website atau approval dari dashboard,
tanpa perlu dua koneksi Baileys terpisah.

## Setup awal

Database: **Supabase (PostgreSQL)**.

```bash
npm install

# isi .env di 4 tempat ini (lihat masing-masing .env.example):
# - packages/shared/.env   (DATABASE_URL)
# - apps/wa-bot/.env       (DATABASE_URL, INTERNAL_API_KEY)
# - apps/api/.env          (DATABASE_URL, JWT_SECRET, INTERNAL_API_KEY - HARUS SAMA dgn wa-bot)
# - apps/web/.env.local    (NEXT_PUBLIC_API_URL)

npm run db:migrate      # buat tabel + aktifkan RLS di Supabase
npm run db:seed         # isi data awal: 3 jenis surat, FAQ, pengaturan umum
npm run create-admin -- admin@contoh.id "PasswordKuat123" "Nama Admin"  # akun admin pertama

npm run dev:bot                        # jalankan chatbot, scan QR yang muncul
npm run dev:api                        # jalankan backend API (port 4000)
npm run dev --workspace=apps/web       # jalankan dashboard admin (port 3000)
```

Buka `http://localhost:3000/admin/login` untuk masuk dashboard.

**Penting**: gunakan nomor WA testing/khusus untuk development, bukan nomor pribadi/resmi
desa, untuk menghindari risiko restriksi dari WhatsApp selama masa uji coba.

## Status pengerjaan

- ✅ **Fase 1 (chatbot)** — Baileys: menu, validasi input, sesi tersimpan di DB, timeout,
  perintah batal/menu, notifikasi admin, log percakapan, generate draft surat, cek status.
- ✅ **Backend API** — Express: endpoint publik (jenis surat, submit permohonan, cek status)
  & admin (auth JWT+bcrypt via httpOnly cookie, RBAC, manajemen permohonan/template/
  settings/akun admin, log aktivitas). Diuji end-to-end terhadap Supabase.
- ✅ **Dashboard Admin** — Next.js 16 (`apps/web`, route `/admin/*`): login, ringkasan,
  manajemen permohonan (filter/detail/approve/reject), manajemen template surat (field
  builder dinamis + upload `.docx`), pengaturan (FAQ/nomor notifikasi/akun admin/pengaturan
  umum), log aktivitas. Design system cardinal red + Source Serif 4/Source Sans 3 terpasang.
  Build produksi sukses; rute admin diverifikasi ter-proteksi (redirect ke login tanpa sesi,
  200 dengan sesi valid) — **belum divalidasi visual di browser** (belum ada akses browser
  interaktif saat build ini dikerjakan), disarankan klik-klik manual sebelum dipakai nyata.
- ⏳ **Website Publik** — landing page, ajukan surat, cek status (halaman `/` saat ini baru
  placeholder).

## Catatan operasional

- Server dev (`wa-bot`, `api`, `web`) cukup berat dijalankan bersamaan di mesin dengan RAM
  terbatas — kalau salah satu proses "hilang" sendiri tanpa error jelas, kemungkinan besar
  di-kill OS karena low memory, bukan bug kode. Tutup yang tidak dipakai kalau perlu.
