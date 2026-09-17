import http from "node:http";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { getActiveSocket } from "../whatsapp/socketRegistry.js";
import { notifyAdminByPermohonanId } from "../notifikasi/notifyAdmin.js";
import { kirimSuratDisetujui } from "../pengiriman/kirimSuratDisetujui.js";

function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) {
        reject(new Error("Body terlalu besar"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Body bukan JSON valid"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, body: Record<string, unknown>): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/**
 * Server HTTP internal kecil, hanya diakses apps/api (bukan publik) untuk memicu aksi
 * yang butuh koneksi WhatsApp aktif - misalnya notifikasi admin saat ada pengajuan surat
 * baru lewat website. Diamankan dengan shared secret header, bukan diekspos ke internet.
 */
export function startInternalServer(): void {
  if (!config.internalApiKey) {
    logger.warn(
      "INTERNAL_API_KEY belum diset - server internal notifikasi TIDAK dijalankan. " +
        "Notifikasi admin untuk permohonan dari website tidak akan terkirim sampai ini diisi."
    );
    return;
  }

  const server = http.createServer((req, res) => {
    void handleRequest(req, res);
  });

  server.listen(config.internalPort, "127.0.0.1", () => {
    logger.info({ port: config.internalPort }, "Server internal wa-bot berjalan (localhost only)");
  });
}

async function readPermohonanId(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<string | null> {
  const body = await readJsonBody(req);
  const permohonanId = typeof body.permohonanId === "string" ? body.permohonanId : "";
  if (!permohonanId) {
    sendJson(res, 400, { ok: false, error: "permohonanId wajib diisi" });
    return null;
  }
  return permohonanId;
}

function requireActiveSocket(
  res: http.ServerResponse,
  permohonanId: string,
  konteks: string
): ReturnType<typeof getActiveSocket> {
  const sock = getActiveSocket();
  if (!sock) {
    logger.warn({ permohonanId }, `${konteks} ditunda: koneksi WhatsApp sedang tidak aktif`);
    sendJson(res, 503, { ok: false, error: "Koneksi WhatsApp sedang tidak aktif" });
    return null;
  }
  return sock;
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    if (req.method === "GET" && req.url === "/internal/health") {
      sendJson(res, 200, { ok: true, connected: getActiveSocket() !== null });
      return;
    }

    if (req.headers["x-internal-api-key"] !== config.internalApiKey) {
      sendJson(res, 401, { ok: false, error: "Unauthorized" });
      return;
    }

    if (req.method === "POST" && req.url === "/internal/notify-admin-permohonan-baru") {
      const permohonanId = await readPermohonanId(req, res);
      if (!permohonanId) return;

      const sock = requireActiveSocket(res, permohonanId, "Notifikasi admin");
      if (!sock) return;

      const sent = await notifyAdminByPermohonanId(sock, permohonanId);
      sendJson(res, sent ? 200 : 404, { ok: sent });
      return;
    }

    if (req.method === "POST" && req.url === "/internal/send-surat-approved") {
      const permohonanId = await readPermohonanId(req, res);
      if (!permohonanId) return;

      const sock = requireActiveSocket(res, permohonanId, "Kirim surat disetujui");
      if (!sock) return;

      const sent = await kirimSuratDisetujui(sock, permohonanId);
      sendJson(res, 200, { ok: true, sent });
      return;
    }

    sendJson(res, 404, { ok: false, error: "Not found" });
  } catch (err) {
    logger.error(err, "Error di server internal wa-bot");
    sendJson(res, 500, { ok: false, error: "Internal error" });
  }
}
