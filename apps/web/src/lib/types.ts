import type { StatusPermohonan, SumberKanal, TipeField, PerananAdmin } from "shared/types";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PermohonanListItem {
  id: string;
  nomorPermohonan: string;
  jenisSurat: { nama: string; kode: string };
  sumberKanal: SumberKanal;
  status: StatusPermohonan;
  createdAt: string;
}

export interface PermohonanListResponse {
  items: PermohonanListItem[];
  pagination: Pagination;
}

export interface PermohonanDetail {
  id: string;
  nomorPermohonan: string;
  sumberKanal: SumberKanal;
  nomorWaPemohon: string | null;
  dataPemohon: Record<string, string>;
  status: StatusPermohonan;
  catatanAdmin: string | null;
  fileDraftPath: string | null;
  fileFinalPath: string | null;
  diprosesPadaAt: string | null;
  createdAt: string;
  jenisSurat: { id: string; nama: string; kode: string; deskripsi: string | null };
  diprosesOleh: { id: string; nama: string; email: string } | null;
}

export interface JenisSuratField {
  id: string;
  key: string;
  label: string;
  tipe: TipeField;
  wajib: boolean;
  urutan: number;
  opsi: string | null;
}

export interface JenisSuratAdmin {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  templateFile: string;
  aktif: boolean;
  fields: JenisSuratField[];
  _count: { permohonan: number };
}

export interface FaqEntry {
  id: string;
  pertanyaan: string;
  jawaban: string;
  kategori: string | null;
  urutan: number;
  aktif: boolean;
}

export interface NotifikasiAdminEntry {
  id: string;
  nomorWa: string;
  nama: string;
  aktif: boolean;
}

export interface PengaturanUmumEntry {
  key: string;
  value: string;
}

export interface AdminUserEntry {
  id: string;
  email: string;
  nama: string;
  peran: PerananAdmin;
  aktif: boolean;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  aksi: string;
  catatan: string | null;
  createdAt: string;
  adminUser: { id: string; nama: string; email: string };
  permohonan: { id: string; nomorPermohonan: string } | null;
}
