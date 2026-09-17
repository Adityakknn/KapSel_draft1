# shared

Skema database (Prisma), tipe TypeScript, dan util validasi yang dipakai bersama oleh
`apps/wa-bot`, `apps/api`/dashboard admin, dan `apps/admin-web`. Satu sumber kebenaran untuk
struktur data — jangan duplikasi skema di app lain.

## Setup

1. Copy `.env.example` jadi `.env`, isi `DATABASE_URL` dengan connection string Supabase:
   Project Settings → Database → Connection string → URI (pakai koneksi langsung port 5432,
   bukan pooler, supaya `prisma migrate` jalan normal).
2. Generate client & jalankan migration pertama kali:
   ```bash
   npm run prisma:migrate --workspace=packages/shared
   ```
3. Seed data awal (jenis surat, FAQ, pengaturan umum):
   ```bash
   npm run seed --workspace=packages/shared
   ```

## Isi

- `prisma/schema.prisma` — skema lengkap: akun admin, jenis surat & field dinamisnya,
  permohonan, log aktivitas, sesi & log chatbot, FAQ, pengaturan umum.
- `prisma/seed.ts` — data awal: 3 jenis surat MVP (Domisili, Usaha, Pengantar) beserta
  field & template docx-nya, FAQ dasar.
- `src/db.ts` — singleton `PrismaClient`.
- `src/validation.ts` — validator input (NIK, nomor HP, tanggal, dll) dipakai chatbot
  maupun form web nanti (validasi client HARUS diulang di server dengan util yang sama).
- `src/nomorPermohonan.ts` — generator nomor permohonan human-readable.

Setiap perubahan skema: edit `schema.prisma`, lalu jalankan
`npm run prisma:migrate --workspace=packages/shared` untuk membuat migration baru, commit
folder `prisma/migrations/` yang dihasilkan.
