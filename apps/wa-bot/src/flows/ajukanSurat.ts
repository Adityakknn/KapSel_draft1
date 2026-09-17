import { prisma, validateByFieldType, sanitizeText, generateSurat, type TipeField } from "shared";
import { reply, type FlowContext, type FlowResult } from "./types.js";
import { STATE_MENU_UTAMA } from "../session/sessionStore.js";
import { logger } from "../logger.js";

export const STATE_AJUKAN_PILIH_JENIS = "AJUKAN_PILIH_JENIS";
export const STATE_AJUKAN_ISI_FIELD = "AJUKAN_ISI_FIELD";
export const STATE_AJUKAN_KONFIRMASI = "AJUKAN_KONFIRMASI";

interface FieldSnapshot {
  key: string;
  label: string;
  tipe: TipeField;
  wajib: boolean;
  opsi: string | null;
}

interface DaftarJenisOpsi {
  id: string;
  kode: string;
  nama: string;
}

interface IsiFieldContext {
  jenisSuratId: string;
  jenisSuratKode: string;
  jenisSuratNama: string;
  fields: FieldSnapshot[];
  currentFieldIndex: number;
  data: Record<string, string>;
}

export async function mulaiAjukanSurat(): Promise<FlowResult> {
  const daftarJenis = await prisma.jenisSurat.findMany({
    where: { aktif: true },
    orderBy: { nama: "asc" },
  });

  if (daftarJenis.length === 0) {
    return reply(
      "Mohon maaf, saat ini belum ada jenis surat yang tersedia untuk diajukan. Silakan hubungi kantor desa langsung.",
      STATE_MENU_UTAMA
    );
  }

  const opsi: DaftarJenisOpsi[] = daftarJenis.map((j) => ({ id: j.id, kode: j.kode, nama: j.nama }));
  const daftarText = daftarJenis.map((j, i) => `${i + 1}. ${j.nama}`).join("\n");

  return reply(
    ["*Ajukan Surat*", "", "Pilih jenis surat dengan mengetik angka:", daftarText],
    STATE_AJUKAN_PILIH_JENIS,
    { daftarJenis: opsi }
  );
}

export async function handlePilihJenis(ctx: FlowContext): Promise<FlowResult> {
  const daftarJenis = (ctx.contextData.daftarJenis as DaftarJenisOpsi[] | undefined) ?? [];
  const pilihan = Number(ctx.text.trim());

  if (!Number.isInteger(pilihan) || pilihan < 1 || pilihan > daftarJenis.length) {
    const daftarText = daftarJenis.map((j, i) => `${i + 1}. ${j.nama}`).join("\n");
    return reply(
      [`Pilihan tidak valid. Ketik angka 1-${daftarJenis.length} sesuai daftar berikut:`, daftarText],
      STATE_AJUKAN_PILIH_JENIS,
      { daftarJenis }
    );
  }

  const dipilih = daftarJenis[pilihan - 1];
  const jenisSurat = await prisma.jenisSurat.findUnique({
    where: { id: dipilih.id },
    include: { fields: { orderBy: { urutan: "asc" } } },
  });

  if (!jenisSurat || jenisSurat.fields.length === 0) {
    return reply(
      "Mohon maaf, konfigurasi jenis surat ini belum lengkap. Silakan hubungi kantor desa langsung.",
      STATE_MENU_UTAMA
    );
  }

  const fields: FieldSnapshot[] = jenisSurat.fields.map((f) => ({
    key: f.key,
    label: f.label,
    tipe: f.tipe,
    wajib: f.wajib,
    opsi: f.opsi,
  }));

  const nextContext: IsiFieldContext = {
    jenisSuratId: jenisSurat.id,
    jenisSuratKode: jenisSurat.kode,
    jenisSuratNama: jenisSurat.nama,
    fields,
    currentFieldIndex: 0,
    data: {},
  };

  return reply(
    [`Baik, mengajukan *${jenisSurat.nama}*.`, "", promptUntukField(fields[0])],
    STATE_AJUKAN_ISI_FIELD,
    nextContext as unknown as Record<string, unknown>
  );
}

function promptUntukField(field: FieldSnapshot): string {
  const opsiText = field.tipe === "SELECT" && field.opsi ? ` (pilihan: ${field.opsi.split("|").join(", ")})` : "";
  return `Masukkan *${field.label}*${opsiText}:`;
}

export async function handleIsiField(ctx: FlowContext): Promise<FlowResult> {
  const context = ctx.contextData as unknown as IsiFieldContext;
  const field = context.fields[context.currentFieldIndex];

  if (!field) {
    // Konteks korup/tidak konsisten - jangan biarkan warga nyangkut, kembalikan ke menu.
    logger.error({ context }, "Konteks isi field tidak valid, mereset ke menu utama");
    return reply("Terjadi kendala pada sesi ini. Silakan mulai ulang dari menu utama.", STATE_MENU_UTAMA);
  }

  const opsi = field.opsi ? field.opsi.split("|").map((s) => s.trim()) : undefined;
  const hasil = validateByFieldType(field.tipe, ctx.text, { label: field.label, options: opsi });

  if (!hasil.valid) {
    return reply([hasil.error ?? "Input tidak valid.", promptUntukField(field)], STATE_AJUKAN_ISI_FIELD, {
      ...context,
    } as unknown as Record<string, unknown>);
  }

  const dataBaru = { ...context.data, [field.key]: sanitizeText(ctx.text.trim()) };
  const indexBerikut = context.currentFieldIndex + 1;

  if (indexBerikut < context.fields.length) {
    const nextContext: IsiFieldContext = { ...context, currentFieldIndex: indexBerikut, data: dataBaru };
    return reply(
      promptUntukField(context.fields[indexBerikut]),
      STATE_AJUKAN_ISI_FIELD,
      nextContext as unknown as Record<string, unknown>
    );
  }

  // Semua field terisi -> tampilkan ringkasan untuk konfirmasi.
  const ringkasan = context.fields.map((f) => `*${f.label}*: ${dataBaru[f.key]}`).join("\n");
  const nextContext: IsiFieldContext = { ...context, currentFieldIndex: indexBerikut, data: dataBaru };

  return reply(
    [
      "*Ringkasan Permohonan*",
      "",
      `Jenis Surat: ${context.jenisSuratNama}`,
      ringkasan,
      "",
      "Ketik *ya* untuk mengirim permohonan ini, atau *batal* untuk membatalkan.",
    ],
    STATE_AJUKAN_KONFIRMASI,
    nextContext as unknown as Record<string, unknown>
  );
}

export async function handleKonfirmasi(ctx: FlowContext): Promise<FlowResult> {
  const jawaban = ctx.text.trim().toLowerCase();
  const context = ctx.contextData as unknown as IsiFieldContext;

  if (!["ya", "iya", "yes", "benar"].includes(jawaban)) {
    return reply(
      "Mohon ketik *ya* untuk mengirim permohonan, atau *batal* untuk membatalkan.",
      STATE_AJUKAN_KONFIRMASI,
      context as unknown as Record<string, unknown>
    );
  }

  const jenisSurat = await prisma.jenisSurat.findUnique({ where: { id: context.jenisSuratId } });
  if (!jenisSurat) {
    logger.error({ context }, "JenisSurat tidak ditemukan saat konfirmasi pengajuan");
    return reply(
      "Mohon maaf, sedang ada kendala teknis saat memproses permohonan. Silakan coba lagi beberapa saat lagi, atau hubungi kantor desa langsung.",
      STATE_MENU_UTAMA
    );
  }

  try {
    const { permohonan } = await generateSurat({
      jenisSurat,
      data: context.data,
      sumberKanal: "WHATSAPP",
      nomorWaPemohon: ctx.nomorWa,
    });

    return reply(
      [
        "✅ Permohonan kamu berhasil diterima!",
        "",
        `Nomor Permohonan: *${permohonan.nomorPermohonan}*`,
        "Simpan nomor ini untuk cek status lewat menu *3. Cek Status Permohonan*.",
        "",
        "Perangkat desa akan memverifikasi permohonan ini terlebih dahulu sebelum surat resmi dikirimkan.",
      ],
      STATE_MENU_UTAMA,
      {},
      [{ type: "NOTIFY_ADMIN_PERMOHONAN_BARU", permohonanId: permohonan.id }]
    );
  } catch (err) {
    // Kegagalan total (mis. DB tidak bisa ditulis) - beri tahu warga dengan sopan, jangan diam saja.
    logger.error({ err, context }, "Gagal memproses pengajuan surat");
    return reply(
      "Mohon maaf, sedang ada kendala teknis sehingga permohonan belum bisa diproses. Silakan coba lagi beberapa saat lagi, atau hubungi kantor desa langsung.",
      STATE_MENU_UTAMA
    );
  }
}
