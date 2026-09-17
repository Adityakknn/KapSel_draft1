# api — Backend E-Layan Desa Sabah Balau

Express + TypeScript. Satu-satunya pintu masuk ke database Supabase untuk Website Publik &
Dashboard Admin (dan jembatan notifikasi WA ke `apps/wa-bot`). Tidak ada akses Supabase
langsung dari frontend - semua lewat sini.

## Setup

1. Copy `.env.example` jadi `.env`. Isi:
   - `DATABASE_URL` - sama dengan `packages/shared/.env`
   - `JWT_SECRET` - string acak panjang (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `INTERNAL_API_KEY` - **harus sama persis** dengan `INTERNAL_API_KEY` di `apps/wa-bot/.env`
2. Jalankan dari root: `npm run dev:api`
3. Buat akun admin pertama (superadmin):
   ```bash
   npm run create-admin -- admin@contoh.id "PasswordKuat123" "Nama Admin"
   ```

## Autentikasi

- `POST /api/admin/login` - JWT disimpan sebagai **httpOnly cookie** (`elayan_admin_token`),
  bukan dikembalikan ke body response, bukan disimpan di localStorage. Frontend cukup kirim
  `credentials: 'include'` di tiap request.
- Setiap request admin memvalidasi ulang status `aktif` akun dari DB (bukan cuma percaya isi
  token) - admin yang baru dinonaktifkan langsung kehilangan akses tanpa perlu tunggu token
  kedaluwarsa.
- Role `SUPERADMIN` vs `STAFF`: endpoint kelola akun admin lain (`/api/admin/users`) dibatasi
  `SUPERADMIN` lewat middleware `requireRole`.

## Endpoint

**Publik** (tanpa login):
- `GET /api/jenis-surat` - daftar jenis surat aktif + struktur field
- `POST /api/permohonan` - submit permohonan baru (validasi server-side penuh)
- `GET /api/permohonan/:nomor` - cek status (HANYA status & nama jenis surat, TIDAK PERNAH
  mengembalikan NIK/alamat)

**Admin** (wajib login, lihat `src/middleware/auth.ts`):
- `POST /api/admin/login`, `/logout`, `GET /me`
- `GET /api/admin/permohonan` (filter status/jenisSuratKode/dari/sampai + pagination),
  `GET /api/admin/permohonan/ringkasan`, `GET /api/admin/permohonan/:id`,
  `POST /api/admin/permohonan/:id/verifikasi`
- `GET/POST/PUT/DELETE /api/admin/templates` (upload `.docx` via multipart, field `fields`
  berisi JSON array definisi field)
- `GET/POST/PUT/DELETE /api/admin/settings/faq`,
  `GET/POST/PUT/DELETE /api/admin/settings/notifikasi-admin`,
  `GET/PUT /api/admin/settings/umum`
- `GET/POST/PUT/DELETE /api/admin/users` (kelola akun admin, `SUPERADMIN` only untuk create/update/delete)
- `GET /api/admin/activity-log`

Semua response pakai format seragam: `{ success: true, data }` atau
`{ success: false, error: { message, details? } }` (lihat `src/lib/apiResponse.ts`).

## Reuse dengan wa-bot

Logika generate surat (isi `.docx` -> convert PDF) dan validasi field ada di
`packages/shared` (`generateSurat`, `validateByFieldType`, dll) - **bukan diduplikasi** di
sini. Saat approve permohonan, API memanggil server internal `apps/wa-bot` (lihat
`src/notify/notifyWaBot.ts` & `apps/wa-bot/src/internal/server.ts`) untuk kirim
notifikasi/dokumen lewat WA - koneksi WhatsApp yang aktif cuma ada di proses wa-bot. Ini
best-effort: kalau wa-bot sedang mati, permohonan tetap tersimpan normal, cuma notifikasi WA
yang tertunda (admin tetap bisa lihat & proses lewat dashboard).

## Keamanan

- Password admin di-hash bcrypt (12 rounds), tidak pernah disimpan/dikembalikan plaintext.
- Row Level Security aktif di semua tabel Supabase (lihat migration `enable_rls`) - defense
  in depth kalau `anon`/`service_role` key Supabase ter-expose ke client suatu saat; koneksi
  Prisma di sini pakai role `postgres` (superuser) yang tidak terpengaruh RLS, jadi backend
  tetap jalan normal.
- Endpoint publik cek status SENGAJA hanya mengembalikan status & nama jenis surat.
