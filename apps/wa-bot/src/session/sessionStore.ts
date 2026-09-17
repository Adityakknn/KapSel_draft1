import { prisma, type ChatSession, type Prisma } from "shared";
import { config } from "../config.js";
import { logger } from "../logger.js";

export const STATE_MENU_UTAMA = "MENU_UTAMA";

/** Ambil sesi yang ada, atau buat sesi baru di state menu utama. Return juga flag apakah baru dibuat. */
export async function getOrCreateSession(
  nomorWa: string
): Promise<{ session: ChatSession; isNew: boolean }> {
  const existing = await prisma.chatSession.findUnique({ where: { nomorWa } });
  if (existing) return { session: existing, isNew: false };

  const created = await prisma.chatSession.create({
    data: { nomorWa, state: STATE_MENU_UTAMA, contextData: {} },
  });
  return { session: created, isNew: true };
}

/** True kalau sesi sudah tidak aktif lebih lama dari batas timeout. */
export function isSessionTimedOut(session: ChatSession): boolean {
  const elapsedMs = Date.now() - session.lastActivityAt.getTime();
  return elapsedMs > config.sessionTimeoutMinutes * 60_000;
}

export async function updateSession(
  id: string,
  data: { state?: string; contextData?: Prisma.InputJsonValue }
): Promise<ChatSession> {
  return prisma.chatSession.update({
    where: { id },
    data: { ...data, lastActivityAt: new Date() },
  });
}

export async function resetSession(id: string): Promise<ChatSession> {
  return updateSession(id, { state: STATE_MENU_UTAMA, contextData: {} });
}

export async function logMessage(
  sessionId: string,
  nomorWa: string,
  arah: "MASUK" | "KELUAR",
  isiPesan: string
): Promise<void> {
  try {
    await prisma.chatMessageLog.create({
      data: { sessionId, nomorWa, arah, isiPesan },
    });
  } catch (err) {
    // Logging tidak boleh menggagalkan alur percakapan utama.
    logger.error({ err, nomorWa, arah }, "Gagal menyimpan log percakapan");
  }
}
