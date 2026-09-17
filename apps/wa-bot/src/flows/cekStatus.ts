import { prisma } from "shared";
import { reply, type FlowContext, type FlowResult } from "./types.js";
import { STATE_MENU_UTAMA } from "../session/sessionStore.js";

export const STATE_CEK_STATUS_INPUT = "CEK_STATUS_INPUT";

const NOMOR_PERMOHONAN_PATTERN = /^[A-Z]+-\d{8}-\d{4}$/i;

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "⏳ Menunggu Verifikasi",
  DISETUJUI: "✅ Disetujui (surat sedang disiapkan)",
  DITOLAK: "❌ Ditolak",
  SELESAI: "📬 Selesai (surat sudah dikirim)",
};

export function mulaiCekStatus(): FlowResult {
  return reply(
    [
      "*Cek Status Permohonan*",
      "",
      "Masukkan nomor permohonan kamu (contoh: DOMISILI-20260917-0001).",
      "Atau ketik *punya saya* untuk melihat permohonan terakhir yang kamu ajukan lewat WhatsApp ini.",
    ],
    STATE_CEK_STATUS_INPUT
  );
}

export async function handleCekStatusInput(ctx: FlowContext): Promise<FlowResult> {
  const input = ctx.text.trim();

  if (NOMOR_PERMOHONAN_PATTERN.test(input)) {
    const permohonan = await prisma.permohonan.findUnique({
      where: { nomorPermohonan: input.toUpperCase() },
      include: { jenisSurat: true },
    });

    if (!permohonan) {
      return reply(
        [`Nomor permohonan *${input}* tidak ditemukan. Periksa kembali nomornya, atau ketik *menu* untuk kembali.`],
        STATE_MENU_UTAMA
      );
    }

    return reply(formatStatus(permohonan), STATE_MENU_UTAMA);
  }

  // Selain format nomor permohonan, anggap warga minta lihat permohonan miliknya sendiri.
  const daftar = await prisma.permohonan.findMany({
    where: { nomorWaPemohon: ctx.nomorWa },
    include: { jenisSurat: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (daftar.length === 0) {
    return reply(
      "Belum ada permohonan yang tercatat dari nomor WhatsApp ini. Ketik *menu* untuk kembali ke menu utama.",
      STATE_MENU_UTAMA
    );
  }

  const baris = daftar.map(
    (p) => `• ${p.nomorPermohonan} — ${p.jenisSurat.nama} — ${STATUS_LABEL[p.status] ?? p.status}`
  );

  return reply(
    ["*Permohonan terakhir kamu:*", "", ...baris, "", "Ketik *menu* untuk kembali ke menu utama."],
    STATE_MENU_UTAMA
  );
}

function formatStatus(permohonan: {
  nomorPermohonan: string;
  status: string;
  catatanAdmin: string | null;
  jenisSurat: { nama: string };
}): string[] {
  const lines = [
    `*Nomor Permohonan*: ${permohonan.nomorPermohonan}`,
    `*Jenis Surat*: ${permohonan.jenisSurat.nama}`,
    `*Status*: ${STATUS_LABEL[permohonan.status] ?? permohonan.status}`,
  ];
  if (permohonan.catatanAdmin) {
    lines.push(`*Catatan Admin*: ${permohonan.catatanAdmin}`);
  }
  lines.push("", "Ketik *menu* untuk kembali ke menu utama.");
  return lines;
}
