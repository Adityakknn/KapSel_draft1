import path from "node:path";
import qrcodeTerminal from "qrcode-terminal";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
  type WAMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { logger } from "../logger.js";
import { setActiveSocket } from "./socketRegistry.js";

const AUTH_DIR = path.resolve(process.cwd(), "auth");
const MAX_RECONNECT_DELAY_MS = 30_000;

type MessageListener = (sock: WASocket, msg: WAMessage) => void;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Starts (or restarts) the Baileys WhatsApp connection.
 * On first run, prints a QR code in the terminal to scan; on later runs,
 * reuses the saved auth state in `AUTH_DIR` so no re-scan is needed.
 *
 * `reconnectAttempt` dipakai internal untuk exponential backoff supaya kalau koneksi
 * putus berulang kali (mis. jaringan bermasalah) bot tidak spam reconnect tanpa jeda.
 */
export async function startWhatsApp(
  onMessagesUpsert: MessageListener,
  reconnectAttempt = 0
): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, "Menggunakan versi WhatsApp Web protocol");

  const sock = makeWASocket({
    version,
    auth: state,
    logger: logger.child({ module: "baileys" }).child({}, { level: "warn" }),
    printQRInTerminal: false,
  });

  setActiveSocket(sock);
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info("Scan QR berikut dengan WhatsApp (Perangkat Tertaut > Tautkan Perangkat):");
      qrcodeTerminal.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn(
        { statusCode, shouldReconnect },
        "Koneksi WhatsApp terputus"
      );

      if (shouldReconnect) {
        const nextAttempt = reconnectAttempt + 1;
        const backoffMs = Math.min(1000 * 2 ** reconnectAttempt, MAX_RECONNECT_DELAY_MS);
        logger.info({ backoffMs, nextAttempt }, "Mencoba menyambungkan ulang ke WhatsApp");
        delay(backoffMs)
          .then(() => startWhatsApp(onMessagesUpsert, nextAttempt))
          .catch((err) => logger.error(err, "Gagal menyambungkan ulang ke WhatsApp"));
      } else {
        setActiveSocket(null);
        logger.error(
          "Sesi logout dari perangkat. Hapus folder 'auth/' lalu jalankan ulang untuk scan QR baru."
        );
      }
    } else if (connection === "open") {
      reconnectAttempt = 0;
      logger.info("Bot WhatsApp E-Layan Desa Sabah Balau berhasil terhubung.");
    }
  });

  sock.ev.on("messages.upsert", (upsert) => {
    if (upsert.type !== "notify") return;
    for (const msg of upsert.messages) {
      onMessagesUpsert(sock, msg);
    }
  });

  return sock;
}
