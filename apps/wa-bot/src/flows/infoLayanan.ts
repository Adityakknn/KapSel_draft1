import { prisma } from "shared";
import { reply, type FlowResult } from "./types.js";
import { STATE_MENU_UTAMA } from "../session/sessionStore.js";
import { logger } from "../logger.js";

const FAQ_FALLBACK = [
  "*Jam Pelayanan*: Senin-Jumat, 08.00-15.00 WIB (istirahat 12.00-13.00 WIB).",
  "*Syarat umum*: KTP asli/fotokopi, Kartu Keluarga, dan menyebutkan keperluan surat dengan jelas.",
].join("\n\n");

export async function handleInfoLayanan(): Promise<FlowResult> {
  let isi = FAQ_FALLBACK;

  try {
    const entries = await prisma.faqEntry.findMany({
      where: { aktif: true },
      orderBy: { urutan: "asc" },
    });
    if (entries.length > 0) {
      isi = entries.map((e) => `*${e.pertanyaan}*\n${e.jawaban}`).join("\n\n");
    }
  } catch (err) {
    // FAQ gagal dimuat dari DB - tetap balas pakai info dasar daripada diam saja.
    logger.error(err, "Gagal memuat FAQ dari database, memakai info dasar");
  }

  return reply(
    ["*Info Layanan Desa Sabah Balau*", "", isi, "", "Ketik *menu* untuk kembali ke menu utama."],
    STATE_MENU_UTAMA
  );
}
