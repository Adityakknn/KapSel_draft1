-- Aktifkan Row Level Security di semua tabel, TANPA policy sama sekali.
--
-- Kenapa ini aman untuk backend kita: koneksi Prisma (wa-bot & api) memakai role
-- "postgres" (superuser/pemilik tabel), dan RLS TIDAK BERLAKU untuk superuser/pemilik
-- tabel kecuali FORCE ROW LEVEL SECURITY diaktifkan (sengaja TIDAK kita aktifkan).
-- Jadi backend tetap berjalan normal seperti biasa.
--
-- Yang diblokir oleh ini: akses lewat Supabase PostgREST/anon key & authenticated key
-- (kalau suatu saat ke-expose ke browser secara tidak sengaja) - karena tidak ada
-- policy yang mengizinkan role anon/authenticated, RLS otomatis default-deny semua
-- akses dari role tsb. Satu-satunya jalur akses data yang sah adalah lewat backend
-- Express (apps/api) yang pakai service-level connection ini.

ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifikasi_admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jenis_surat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jenis_surat_field" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permohonan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_message_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "faq_entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pengaturan_umum" ENABLE ROW LEVEL SECURITY;
