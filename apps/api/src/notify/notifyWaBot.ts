import { config } from "../config.js";
import { logger } from "../logger.js";

/**
 * Minta wa-bot mengirim notifikasi WA ke admin lewat server internalnya (lihat
 * apps/wa-bot/src/internal/server.ts). Best-effort: kalau wa-bot sedang mati/tidak
 * terhubung, permohonan warga TETAP dianggap berhasil tercatat - notifikasi cuma
 * bonus, jangan sampai gagal kirim WA membuat submit form website ikut gagal.
 */
export async function notifyAdminViaWaBot(permohonanId: string): Promise<void> {
  if (!config.internalApiKey) {
    logger.warn("INTERNAL_API_KEY belum diset di apps/api - notifikasi admin lewat WA dilewati");
    return;
  }

  try {
    const res = await fetch(`${config.internalWaBotUrl}/internal/notify-admin-permohonan-baru`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": config.internalApiKey,
      },
      body: JSON.stringify({ permohonanId }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      logger.warn(
        { status: res.status, permohonanId },
        "wa-bot menolak/gagal memproses permintaan notifikasi admin"
      );
    }
  } catch (err) {
    logger.warn(
      { err, permohonanId },
      "Tidak bisa menghubungi wa-bot untuk notifikasi admin (mungkin sedang tidak berjalan)"
    );
  }
}

/**
 * Minta wa-bot mengirim file surat yang sudah disetujui balik ke WA warga pengaju.
 * Return `sent=false` untuk kondisi wajar yang bukan kegagalan (mis. permohonan dari
 * website tanpa nomor WA) - caller TIDAK perlu menganggap ini error, hanya info status.
 */
export async function kirimSuratViaWaBot(permohonanId: string): Promise<boolean> {
  if (!config.internalApiKey) {
    logger.warn("INTERNAL_API_KEY belum diset di apps/api - pengiriman surat otomatis lewat WA dilewati");
    return false;
  }

  try {
    const res = await fetch(`${config.internalWaBotUrl}/internal/send-surat-approved`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": config.internalApiKey,
      },
      body: JSON.stringify({ permohonanId }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      logger.warn({ status: res.status, permohonanId }, "wa-bot gagal memproses pengiriman surat disetujui");
      return false;
    }

    const body = (await res.json()) as { ok: boolean; sent: boolean };
    return body.sent === true;
  } catch (err) {
    logger.warn(
      { err, permohonanId },
      "Tidak bisa menghubungi wa-bot untuk kirim surat disetujui (mungkin sedang tidak berjalan)"
    );
    return false;
  }
}
