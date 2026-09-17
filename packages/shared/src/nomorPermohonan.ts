import type { PrismaClient } from "@prisma/client";

/**
 * Generate nomor permohonan human-readable & unik, contoh: "SKD-20260917-0003"
 * (kode jenis surat - tanggal - urutan ke-berapa pada hari itu untuk jenis surat tsb).
 */
export async function generateNomorPermohonan(
  prisma: PrismaClient,
  kodeJenisSurat: string
): Promise<string> {
  const now = new Date();
  const tanggal = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const count = await prisma.permohonan.count({
    where: {
      jenisSurat: { kode: kodeJenisSurat },
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });

  const urutan = String(count + 1).padStart(4, "0");
  return `${kodeJenisSurat.toUpperCase()}-${tanggal}-${urutan}`;
}
