import { PrismaClient, type TipeField } from "@prisma/client";

const prisma = new PrismaClient();

interface FieldSeed {
  key: string;
  label: string;
  tipe: TipeField;
  wajib?: boolean;
  urutan: number;
  opsi?: string;
}

interface JenisSuratSeed {
  kode: string;
  nama: string;
  deskripsi: string;
  templateFile: string;
  fields: FieldSeed[];
}

const JENIS_SURAT: JenisSuratSeed[] = [
  {
    kode: "domisili",
    nama: "Surat Keterangan Domisili",
    deskripsi: "Keterangan bahwa warga berdomisili di Desa Sabah Balau.",
    templateFile: "surat-keterangan-domisili.docx",
    fields: [
      { key: "nama", label: "Nama Lengkap", tipe: "TEXT", urutan: 1 },
      { key: "nik", label: "NIK (16 digit)", tipe: "NIK", urutan: 2 },
      { key: "tempatTanggalLahir", label: "Tempat, Tanggal Lahir (contoh: Bandar Lampung, 01-01-1990)", tipe: "TEXT", urutan: 3 },
      { key: "jenisKelamin", label: "Jenis Kelamin", tipe: "SELECT", urutan: 4, opsi: "Laki-laki|Perempuan" },
      { key: "pekerjaan", label: "Pekerjaan", tipe: "TEXT", urutan: 5 },
      { key: "alamatKtp", label: "Alamat sesuai KTP", tipe: "TEXTAREA", urutan: 6 },
      { key: "keperluan", label: "Keperluan Surat", tipe: "TEXTAREA", urutan: 7 },
    ],
  },
  {
    kode: "usaha",
    nama: "Surat Keterangan Usaha",
    deskripsi: "Keterangan kepemilikan usaha warga Desa Sabah Balau.",
    templateFile: "surat-keterangan-usaha.docx",
    fields: [
      { key: "nama", label: "Nama Lengkap", tipe: "TEXT", urutan: 1 },
      { key: "nik", label: "NIK (16 digit)", tipe: "NIK", urutan: 2 },
      { key: "alamat", label: "Alamat Tempat Tinggal", tipe: "TEXTAREA", urutan: 3 },
      { key: "namaUsaha", label: "Nama Usaha", tipe: "TEXT", urutan: 4 },
      { key: "jenisUsaha", label: "Jenis Usaha", tipe: "TEXT", urutan: 5 },
      { key: "alamatUsaha", label: "Alamat Usaha", tipe: "TEXTAREA", urutan: 6 },
      { key: "keperluan", label: "Keperluan Surat", tipe: "TEXTAREA", urutan: 7 },
    ],
  },
  {
    kode: "pengantar",
    nama: "Surat Pengantar",
    deskripsi: "Surat pengantar dari desa untuk keperluan administrasi ke instansi lain.",
    templateFile: "surat-pengantar.docx",
    fields: [
      { key: "nama", label: "Nama Lengkap", tipe: "TEXT", urutan: 1 },
      { key: "nik", label: "NIK (16 digit)", tipe: "NIK", urutan: 2 },
      { key: "alamat", label: "Alamat Tempat Tinggal", tipe: "TEXTAREA", urutan: 3 },
      { key: "keperluan", label: "Keperluan Surat", tipe: "TEXTAREA", urutan: 4 },
      { key: "tujuanSurat", label: "Ditujukan Kepada (contoh: Camat Tanjung Bintang)", tipe: "TEXT", urutan: 5 },
    ],
  },
];

const FAQ_ENTRIES = [
  {
    pertanyaan: "Jam Pelayanan",
    jawaban: "Senin-Jumat, pukul 08.00-15.00 WIB (istirahat 12.00-13.00 WIB). Sabtu, Minggu, dan hari libur nasional tutup.",
    urutan: 1,
  },
  {
    pertanyaan: "Syarat Dokumen Umum",
    jawaban: "Siapkan KTP asli/fotokopi dan Kartu Keluarga. Beberapa jenis surat mungkin butuh dokumen tambahan sesuai keperluan.",
    urutan: 2,
  },
  {
    pertanyaan: "Berapa Lama Proses Surat?",
    jawaban: "Permohonan diverifikasi oleh perangkat desa. Umumnya surat selesai 1-3 hari kerja setelah permohonan disetujui.",
    urutan: 3,
  },
];

async function main() {
  for (const js of JENIS_SURAT) {
    const jenisSurat = await prisma.jenisSurat.upsert({
      where: { kode: js.kode },
      update: { nama: js.nama, deskripsi: js.deskripsi, templateFile: js.templateFile, aktif: true },
      create: {
        kode: js.kode,
        nama: js.nama,
        deskripsi: js.deskripsi,
        templateFile: js.templateFile,
        aktif: true,
      },
    });

    for (const f of js.fields) {
      await prisma.jenisSuratField.upsert({
        where: { jenisSuratId_key: { jenisSuratId: jenisSurat.id, key: f.key } },
        update: {
          label: f.label,
          tipe: f.tipe,
          wajib: f.wajib ?? true,
          urutan: f.urutan,
          opsi: f.opsi ?? null,
        },
        create: {
          jenisSuratId: jenisSurat.id,
          key: f.key,
          label: f.label,
          tipe: f.tipe,
          wajib: f.wajib ?? true,
          urutan: f.urutan,
          opsi: f.opsi ?? null,
        },
      });
    }
    console.log(`Seed jenis surat: ${js.nama} (${js.fields.length} field)`);
  }

  for (const faq of FAQ_ENTRIES) {
    const existing = await prisma.faqEntry.findFirst({ where: { pertanyaan: faq.pertanyaan } });
    if (existing) {
      await prisma.faqEntry.update({ where: { id: existing.id }, data: faq });
    } else {
      await prisma.faqEntry.create({ data: faq });
    }
  }
  console.log(`Seed FAQ: ${FAQ_ENTRIES.length} entri`);

  await prisma.pengaturanUmum.upsert({
    where: { key: "nama_kepala_desa" },
    update: {},
    create: { key: "nama_kepala_desa", value: "(Nama Kepala Desa)" },
  });

  const adminNumbers = (process.env.SEED_ADMIN_WA_NUMBERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminNumbers.length === 0) {
    console.warn(
      "SEED_ADMIN_WA_NUMBERS kosong - tidak ada nomor admin yang diseed. " +
        "Tambahkan lewat dashboard admin nanti, atau set env ini lalu jalankan seed ulang."
    );
  } else {
    for (const nomor of adminNumbers) {
      await prisma.notifikasiAdmin.upsert({
        where: { nomorWa: nomor },
        update: { aktif: true },
        create: { nomorWa: nomor, nama: "Perangkat Desa", aktif: true },
      });
    }
    console.log(`Seed nomor admin notifikasi: ${adminNumbers.join(", ")}`);
  }
}

main()
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
