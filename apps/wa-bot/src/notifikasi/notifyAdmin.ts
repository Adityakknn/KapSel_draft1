import type { WASocket } from "@whiskeysockets/baileys";
import { prisma, normalizePhoneToWaJid, type Permohonan, type JenisSurat } from "shared";
import { logger } from "../logger.js";

/**
 * Kirim notifikasi WA ke semua nomor admin desa yang aktif setiap ada permohonan baru masuk.
 * Kegagalan kirim ke satu nomor tidak boleh menghentikan pengiriman ke nomor admin lainnya.
 */
export async function notifyAdminPermohonanBaru(
  sock: WASocket,
  permohonan: Permohonan,
  jenisSurat: JenisSurat
): Promise<void> {
  const adminNumbers = await prisma.notifikasiAdmin.findMany({ where: { aktif: true } });

  if (adminNumbers.length === 0) {
    logger.warn("Tidak ada nomor admin aktif terdaftar untuk menerima notifikasi permohonan baru");
    return;
  }

  const teks = [
    "📩 *Permohonan Surat Baru*",
    "",
    `Nomor: ${permohonan.nomorPermohonan}`,
    `Jenis Surat: ${jenisSurat.nama}`,
    `Kanal: ${permohonan.sumberKanal}`,
    "",
    "Silakan buka dashboard admin untuk memverifikasi.",
  ].join("\n");

  await Promise.all(
    adminNumbers.map(async (admin) => {
      try {
        await sock.sendMessage(normalizePhoneToWaJid(admin.nomorWa), { text: teks });
      } catch (err) {
        logger.error(
          { err, nomorWa: admin.nomorWa, nomorPermohonan: permohonan.nomorPermohonan },
          "Gagal mengirim notifikasi WA ke admin"
        );
      }
    })
  );
}

/**
 * Helper bersama: ambil Permohonan+JenisSurat by id lalu kirim notifikasi.
 * Dipakai baik oleh alur chatbot (pengajuan lewat WA) maupun endpoint internal
 * yang dipanggil apps/api saat ada pengajuan baru lewat website.
 */
export async function notifyAdminByPermohonanId(sock: WASocket, permohonanId: string): Promise<boolean> {
  const permohonan = await prisma.permohonan.findUnique({
    where: { id: permohonanId },
    include: { jenisSurat: true },
  });
  if (!permohonan) {
    logger.warn({ permohonanId }, "Permohonan tidak ditemukan saat mengirim notifikasi admin");
    return false;
  }
  await notifyAdminPermohonanBaru(sock, permohonan, permohonan.jenisSurat);
  return true;
}
