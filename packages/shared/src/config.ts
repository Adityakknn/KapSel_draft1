import path from "node:path";

/**
 * Lokasi storage draft surat & folder template .docx, dipakai bersama oleh wa-bot & api.
 * Path relatif di-resolve terhadap cwd app yang menjalankannya - konsisten selama semua
 * app hidup di kedalaman folder yang sama (apps/<nama-app>), sesuai default "../../storage".
 */
export const sharedConfig = {
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR ?? "../../storage"),
  templatesDir: path.resolve(process.cwd(), process.env.TEMPLATES_DIR ?? "../../templates"),
};
