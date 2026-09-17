-- CreateEnum
CREATE TYPE "PerananAdmin" AS ENUM ('SUPERADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "TipeField" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'NIK', 'TELEPON', 'SELECT');

-- CreateEnum
CREATE TYPE "SumberKanal" AS ENUM ('WHATSAPP', 'WEBSITE');

-- CreateEnum
CREATE TYPE "StatusPermohonan" AS ENUM ('MENUNGGU_VERIFIKASI', 'DISETUJUI', 'DITOLAK', 'SELESAI');

-- CreateEnum
CREATE TYPE "ArahPesan" AS ENUM ('MASUK', 'KELUAR');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "peran" "PerananAdmin" NOT NULL DEFAULT 'STAFF',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifikasi_admin" (
    "id" TEXT NOT NULL,
    "nomorWa" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifikasi_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_surat" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "templateFile" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenis_surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_surat_field" (
    "id" TEXT NOT NULL,
    "jenisSuratId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tipe" "TipeField" NOT NULL,
    "wajib" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "opsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jenis_surat_field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permohonan" (
    "id" TEXT NOT NULL,
    "nomorPermohonan" TEXT NOT NULL,
    "jenisSuratId" TEXT NOT NULL,
    "sumberKanal" "SumberKanal" NOT NULL,
    "nomorWaPemohon" TEXT,
    "dataPemohon" JSONB NOT NULL,
    "status" "StatusPermohonan" NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
    "catatanAdmin" TEXT,
    "fileDraftPath" TEXT,
    "fileFinalPath" TEXT,
    "diprosesOlehId" TEXT,
    "diprosesPadaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permohonan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "permohonanId" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_session" (
    "id" TEXT NOT NULL,
    "nomorWa" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "contextData" JSONB NOT NULL DEFAULT '{}',
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message_log" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "nomorWa" TEXT NOT NULL,
    "arah" "ArahPesan" NOT NULL,
    "isiPesan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_entry" (
    "id" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "kategori" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengaturan_umum" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaturan_umum_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "notifikasi_admin_nomorWa_key" ON "notifikasi_admin"("nomorWa");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_surat_kode_key" ON "jenis_surat"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_surat_field_jenisSuratId_key_key" ON "jenis_surat_field"("jenisSuratId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "permohonan_nomorPermohonan_key" ON "permohonan"("nomorPermohonan");

-- CreateIndex
CREATE UNIQUE INDEX "chat_session_nomorWa_key" ON "chat_session"("nomorWa");

-- CreateIndex
CREATE INDEX "chat_message_log_nomorWa_idx" ON "chat_message_log"("nomorWa");

-- AddForeignKey
ALTER TABLE "jenis_surat_field" ADD CONSTRAINT "jenis_surat_field_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "jenis_surat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permohonan" ADD CONSTRAINT "permohonan_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "jenis_surat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permohonan" ADD CONSTRAINT "permohonan_diprosesOlehId_fkey" FOREIGN KEY ("diprosesOlehId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_permohonanId_fkey" FOREIGN KEY ("permohonanId") REFERENCES "permohonan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_log" ADD CONSTRAINT "chat_message_log_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
