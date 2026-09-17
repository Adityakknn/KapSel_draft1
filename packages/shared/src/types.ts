/**
 * Tipe murni (tanpa runtime dependency ke @prisma/client) yang aman diimpor dari frontend
 * (Next.js client components) lewat `shared/types`. Entry point utama `shared` (".") meng-
 * instansiasi PrismaClient saat di-import - TIDAK BOLEH pernah masuk ke bundle browser.
 * Nilai di sini harus selalu sinkron manual dengan enum di prisma/schema.prisma.
 */

export type StatusPermohonan = "MENUNGGU_VERIFIKASI" | "DISETUJUI" | "DITOLAK" | "SELESAI";

export type SumberKanal = "WHATSAPP" | "WEBSITE";

export type TipeField = "TEXT" | "TEXTAREA" | "NUMBER" | "DATE" | "NIK" | "TELEPON" | "SELECT";

export type PerananAdmin = "SUPERADMIN" | "STAFF";

export type ArahPesan = "MASUK" | "KELUAR";

export interface JenisSuratFieldDTO {
  key: string;
  label: string;
  tipe: TipeField;
  wajib: boolean;
  urutan: number;
  opsi?: string[];
}

export interface JenisSuratDTO {
  kode: string;
  nama: string;
  deskripsi?: string | null;
  fields: JenisSuratFieldDTO[];
}
