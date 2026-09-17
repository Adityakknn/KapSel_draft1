import "dotenv/config";
import { startWhatsApp } from "./whatsapp/connection.js";
import { handleIncomingMessage } from "./handlers/messageHandler.js";
import { startInternalServer } from "./internal/server.js";
import { logger } from "./logger.js";

async function main() {
  startInternalServer();
  await startWhatsApp((sock, msg) => {
    handleIncomingMessage(sock, msg).catch((err) =>
      logger.error(err, "Gagal memproses pesan masuk")
    );
  });
}

main().catch((err) => {
  logger.error(err, "Bot gagal dijalankan");
  process.exit(1);
});
