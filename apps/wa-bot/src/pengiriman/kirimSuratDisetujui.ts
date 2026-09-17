import fs from "node:fs/promises";
import path from "node:path";
import type { WASocket } from "@whiskeysockets/baileys";
import { prisma, normalizePhoneToWaJid } from "shared";
import { logger } from "../logger.js";

/**
 * Kirim file surat yang sudah disetujui admin kembali ke warga pengaju lewat WA.
 * Return false (bukan throw) untuk kondisi yang memang tidak bisa dikirim otomatis
 * (bukan dari WA / belum ada file) - caller (endpoint internal) yang putuskan tindak lanjutnya.
 */
export async function kirimSuratDisetujui(sock: WASocket, permohonanId: string): Promise<boolean> {
  const permohonan = await prisma.permohonan.findUnique({
    where: { id: permohonanId },
    include: { jenisSurat: true },
  });

  if (!permohonan) {
    logger.warn({ permohonanId }, "Permohonan tidak ditemukan saat mau kirim surat yang disetujui");
    return false;
  }
  if (!permohonan.nomorWaPemohon) {
    logger.info(
      { permohonanId },
      "Permohonan tidak punya nomor WA pemohon (kemungkinan dari website) - tidak dikirim otomatis lewat WA"
    );
    return false;
  }

  const filePath = permohonan.fileFinalPath ?? permohonan.fileDraftPath;
  if (!filePath) {
    logger.warn({ permohonanId }, "Belum ada file surat untuk dikirim ke warga");
    return false;
  }

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimetype =
      ext === ".pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    await sock.sendMessage(normalizePhoneToWaJid(permohonan.nomorWaPemohon), {
      document: buffer,
      fileName: `${permohonan.nomorPermohonan}${ext}`,
      mimetype,
      caption: [
        `✅ Permohonan *${permohonan.jenisSurat.nama}* kamu telah *disetujui*.`,
        `Nomor Permohonan: ${permohonan.nomorPermohonan}`,
        "",
        "Surat resmi terlampir. Terima kasih.",
      ].join("\n"),
    });

    return true;
  } catch (err) {
    logger.error({ err, permohonanId }, "Gagal mengirim surat yang sudah disetujui ke warga");
    return false;
  }
}
