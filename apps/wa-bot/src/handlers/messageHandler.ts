import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { logger } from "../logger.js";
import {
  getOrCreateSession,
  isSessionTimedOut,
  resetSession,
  updateSession,
  logMessage,
  STATE_MENU_UTAMA,
} from "../session/sessionStore.js";
import { sambutanAwal, handleMenuUtama } from "../flows/menuUtama.js";
import {
  handlePilihJenis,
  handleIsiField,
  handleKonfirmasi,
  STATE_AJUKAN_PILIH_JENIS,
  STATE_AJUKAN_ISI_FIELD,
  STATE_AJUKAN_KONFIRMASI,
} from "../flows/ajukanSurat.js";
import { handleCekStatusInput, STATE_CEK_STATUS_INPUT } from "../flows/cekStatus.js";
import { notifyAdminByPermohonanId } from "../notifikasi/notifyAdmin.js";
import type { FlowContext, FlowResult, FlowSideEffect } from "../flows/types.js";

const GLOBAL_CANCEL_WORDS = new Set(["batal", "menu", "cancel"]);

function extractText(msg: WAMessage): string {
  const m = msg.message;
  if (!m) return "";
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.videoMessage?.caption ??
    ""
  ).trim();
}

async function routeToFlow(state: string, ctx: FlowContext): Promise<FlowResult> {
  switch (state) {
    case STATE_AJUKAN_PILIH_JENIS:
      return handlePilihJenis(ctx);
    case STATE_AJUKAN_ISI_FIELD:
      return handleIsiField(ctx);
    case STATE_AJUKAN_KONFIRMASI:
      return handleKonfirmasi(ctx);
    case STATE_CEK_STATUS_INPUT:
      return handleCekStatusInput(ctx);
    case STATE_MENU_UTAMA:
    default:
      return handleMenuUtama(ctx);
  }
}

async function executeSideEffect(sock: WASocket, effect: FlowSideEffect): Promise<void> {
  if (effect.type === "NOTIFY_ADMIN_PERMOHONAN_BARU") {
    await notifyAdminByPermohonanId(sock, effect.permohonanId);
  }
}

export async function handleIncomingMessage(sock: WASocket, msg: WAMessage): Promise<void> {
  const fromJid = msg.key.remoteJid;
  if (!fromJid || msg.key.fromMe) return;
  if (fromJid.endsWith("@g.us")) return; // MVP: hanya layani chat pribadi, bukan grup.

  const nomorWa = fromJid.replace(/@s\.whatsapp\.net$/, "");
  const text = extractText(msg);
  if (!text) return;

  try {
    const { session, isNew } = await getOrCreateSession(nomorWa);
    await logMessage(session.id, nomorWa, "MASUK", text);

    if (isNew) {
      const hasil = sambutanAwal();
      await kirimBalasan(sock, session.id, nomorWa, hasil);
      return;
    }

    let activeSession = session;
    if (isSessionTimedOut(session)) {
      activeSession = await resetSession(session.id);
      await sock.sendMessage(fromJid, {
        text: "Sesi sebelumnya sudah tidak aktif lebih dari 10 menit dan direset otomatis.",
      });
    }

    if (GLOBAL_CANCEL_WORDS.has(text.trim().toLowerCase())) {
      // kirimBalasan() di bawah sudah menyimpan state MENU_UTAMA/{} dari hasil sambutanAwal(),
      // jadi tidak perlu resetSession() terpisah di sini.
      const hasil = sambutanAwal();
      await kirimBalasan(sock, activeSession.id, nomorWa, hasil);
      return;
    }

    const ctx: FlowContext = {
      nomorWa,
      text,
      contextData: (activeSession.contextData as Record<string, unknown>) ?? {},
    };

    const hasil = await routeToFlow(activeSession.state, ctx);
    await kirimBalasan(sock, activeSession.id, nomorWa, hasil);

    if (hasil.sideEffects) {
      for (const effect of hasil.sideEffects) {
        try {
          await executeSideEffect(sock, effect);
        } catch (err) {
          logger.error({ err, effect }, "Gagal menjalankan side effect alur chatbot");
        }
      }
    }
  } catch (err) {
    logger.error({ err, nomorWa }, "Gagal memproses pesan masuk - mengirim pesan kendala ke warga");
    try {
      await sock.sendMessage(fromJid, {
        text: "Mohon maaf, sedang ada kendala teknis pada sistem kami. Silakan coba lagi beberapa saat lagi.",
      });
    } catch (sendErr) {
      logger.error({ err: sendErr, nomorWa }, "Gagal mengirim pesan kendala teknis ke warga");
    }
  }
}

async function kirimBalasan(
  sock: WASocket,
  sessionId: string,
  nomorWa: string,
  hasil: FlowResult
): Promise<void> {
  for (const teks of hasil.replies) {
    await sock.sendMessage(`${nomorWa}@s.whatsapp.net`, { text: teks });
    await logMessage(sessionId, nomorWa, "KELUAR", teks);
  }
  await updateSession(sessionId, { state: hasil.nextState, contextData: hasil.nextContext });
}
