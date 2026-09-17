# wa-bot — Chatbot WhatsApp E-Layan Desa Sabah Balau

Bot WhatsApp berbasis [Baileys](https://github.com/WhiskeySockets/Baileys) untuk layanan
informasi & pengajuan surat administrasi Desa Sabah Balau.

## Fitur (Fase 1)

- Menu utama: Info Layanan, Ajukan Surat, Cek Status Permohonan.
- Alur pengajuan surat step-by-step dengan **validasi input ketat** per jenis field
  (NIK 16 digit, nomor HP, tanggal, dll — lihat `packages/shared/src/validation.ts`).
- **Sesi tersimpan di database** (bukan in-memory) — state percakapan & data yang sedang
  diisi tidak hilang kalau bot restart.
- **Session timeout** 10 menit (bisa diubah lewat `SESSION_TIMEOUT_MINUTES`) — sesi yang
  tidak aktif otomatis direset ke menu utama.
- Perintah global **`batal`** / **`menu`** — kembali ke menu utama kapan saja.
- **Log percakapan** (masuk & keluar) tersimpan di tabel `chat_message_log` untuk audit.
- Saat ada permohonan baru masuk, bot otomatis **mengirim notifikasi WA** ke semua nomor
  di tabel `notifikasi_admin` yang aktif.
- Generate draft surat (.docx → .pdf) otomatis saat warga konfirmasi pengajuan (logic-nya
  ada di `packages/shared`, dipakai bersama `apps/api` untuk pengajuan lewat website). Kalau
  konversi PDF gagal (mis. LibreOffice belum terpasang di server), draft `.docx` tetap
  disimpan dan permohonan tetap tercatat untuk diproses manual oleh admin — bot tidak
  pernah diam/crash karena kegagalan di tahap ini.
- Auto-reconnect dengan backoff kalau koneksi WhatsApp terputus.
- **Server internal** (localhost only, lihat `src/internal/server.ts`) yang dipanggil
  `apps/api`: kirim notifikasi WA admin untuk pengajuan dari website, dan kirim file surat
  balik ke warga saat admin approve dari dashboard.

## Setup

1. Copy `.env.example` jadi `.env`, isi `DATABASE_URL` (Supabase, sama dengan yang dipakai
   `packages/shared`) dan `INTERNAL_API_KEY` (string acak, **harus sama persis** dengan
   `INTERNAL_API_KEY` di `apps/api/.env`).
2. Dari root project, generate Prisma Client & jalankan migration (sekali saja / tiap ada
   perubahan skema):
   ```bash
   npm run db:migrate
   ```
3. Seed data awal (3 jenis surat MVP + FAQ + pengaturan umum):
   ```bash
   npm run db:seed
   ```
   Opsional: set `SEED_ADMIN_WA_NUMBERS` di `packages/shared/.env` (format `62xxxxxxxxxxx`,
   pisahkan koma) sebelum seed supaya notifikasi admin langsung aktif.
4. Jalankan bot dari root:
   ```bash
   npm run dev:bot
   ```
5. Scan QR yang muncul di terminal (WhatsApp > Perangkat Tertaut > Tautkan Perangkat).
   **Gunakan nomor WA testing**, bukan nomor pribadi/resmi desa.

## Struktur

```
src/
  index.ts              entrypoint
  config.ts              baca env (timeout sesi, port/key server internal)
  whatsapp/connection.ts koneksi Baileys, QR login, auto-reconnect
  whatsapp/socketRegistry.ts referensi socket aktif (dipakai server internal)
  handlers/messageHandler.ts  router: sesi, timeout, perintah global, logging, dispatch
  flows/                 satu file per langkah menu (menuUtama, ajukanSurat, cekStatus, infoLayanan)
  session/sessionStore.ts CRUD sesi chat di DB
  notifikasi/notifyAdmin.ts kirim WA ke nomor admin saat ada permohonan baru
  pengiriman/kirimSuratDisetujui.ts kirim file surat ke warga saat disetujui admin
  internal/server.ts      HTTP server localhost-only, dipanggil apps/api
```

Skema database, util validasi, dan logic generate surat (`generateSurat`) ada di
`packages/shared` - dipakai bersama `apps/api` (dashboard admin & website publik), tidak
diduplikasi di sini.

## Catatan produksi

- Konversi PDF butuh [LibreOffice](https://www.libreoffice.org/download/download/) terpasang
  di server (binary `soffice` harus ada di PATH). Tanpa ini, sistem tetap jalan tapi hanya
  menghasilkan draft `.docx`.
- Data warga (NIK, alamat) disimpan di kolom `dataPemohon` (JSON) pada tabel `permohonan` —
  jangan expose tabel ini lewat endpoint publik mana pun.
