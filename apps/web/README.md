# web — Dashboard Admin & Website Publik E-Layan Desa Sabah Balau

Next.js 16 (App Router) + TypeScript + Tailwind v4. Satu app untuk dua audiens:

- `/admin/*` — Dashboard Admin, wajib login, dipakai perangkat desa.
- `/` dan rute publik lain — Website Publik untuk warga (menyusul di fase berikutnya).

Tidak ada akses database langsung dari sini — semua data lewat `apps/api` via `fetch`
dengan cookie sesi (`credentials: 'include'`).

## Setup

1. Copy `.env.example` jadi `.env.local`, isi `NEXT_PUBLIC_API_URL` (default
   `http://localhost:4000`, sesuaikan kalau `apps/api` jalan di port/host lain).
2. Pastikan `apps/api` sudah jalan (`npm run dev:api` dari root) — dashboard ini murni
   klien terhadapnya, tidak akan berfungsi kalau API mati.
3. Dari root: `npm run dev --workspace=apps/web` (atau `cd apps/web && npm run dev`).
4. Buka `http://localhost:3000/admin/login`, login pakai akun yang dibuat lewat
   `npm run create-admin` di `apps/api`.

## Autentikasi & proteksi route

- Login mengirim POST ke `apps/api`, yang men-set cookie httpOnly cross-origin
  (`elayan_admin_token`). Browser otomatis mengirim cookie ini di setiap `fetch`
  berikutnya ke API karena `credentials: 'include'` + CORS `credentials: true` di API.
- `src/proxy.ts` (di Next.js 16, `middleware.ts` lama sekarang bernama **Proxy** — lihat
  catatan di `AGENTS.md`/`CLAUDE.md` app ini) melakukan **optimistic check**: kalau cookie
  sama sekali tidak ada, langsung redirect ke `/admin/login` sebelum shell dashboard
  dirender. Ini BUKAN pemeriksaan keamanan sesungguhnya (cuma cek keberadaan cookie, bukan
  validitas JWT-nya).
- Enforcement sesungguhnya ada dua lapis lagi: `apps/api` memvalidasi JWT + status `aktif`
  admin di **setiap** request (lihat `apps/api/src/middleware/auth.ts`), dan
  `ProtectedAdminLayout` (`src/app/admin/(protected)/layout.tsx`) redirect di sisi klien
  kalau `GET /api/admin/me` mengembalikan 401.
- Halaman & komponen di dashboard sengaja **client component** (`'use client'`) yang fetch
  langsung ke API — bukan Server Components/Server Actions — karena backend adalah service
  Express terpisah, bukan database yang bisa diakses langsung dari Next.js server. Lihat
  `src/lib/api.ts` untuk wrapper fetch-nya.

## Design system

Token warna & font ada di `packages/shared/src/design-tokens.ts` (dokumentasi/source of
truth) dan **di-mirror manual** sebagai CSS custom properties di `src/app/globals.css`
lewat `@theme` (Tailwind v4 baca theme dari CSS, bukan objek JS — kalau ubah warna, update
KEDUA file). Font Source Serif 4 (heading) & Source Sans 3 (body) dimuat lewat
`next/font/google` di `src/app/layout.tsx`.

## Struktur

```
src/
  proxy.ts                     optimistic auth redirect (lihat di atas)
  app/
    layout.tsx, globals.css     font & design tokens
    page.tsx                    placeholder landing (website publik menyusul)
    admin/
      layout.tsx                 bungkus <AuthProvider>
      login/page.tsx              form login
      (protected)/layout.tsx      sidebar + header + guard client-side
      (protected)/page.tsx        dashboard (ringkasan status)
      (protected)/permohonan/     list + detail/verifikasi
      (protected)/templates/      CRUD jenis surat + field builder + upload docx
      (protected)/settings/       tab FAQ, nomor notifikasi, pengaturan umum, akun admin
      (protected)/activity-log/   riwayat approve/reject
  components/                   komponen UI bersama (Card, StatusBadge, Sidebar, dst)
  lib/
    api.ts                       fetch wrapper + ApiError
    auth-context.tsx             AuthProvider/useAuth
    useApi.ts                    hook fetch+loading+error generik
    types.ts                     tipe DTO respons API (import enum murni dari `shared/types`)
```

`shared/types` (subpath export, BUKAN `shared` utama) dipakai untuk tipe enum murni
(`StatusPermohonan`, `TipeField`, dst) tanpa menarik `@prisma/client` ke bundle browser —
entry point utama `shared` menginstansiasi `PrismaClient` saat di-import dan **tidak boleh**
pernah diimpor dari kode client-side.
