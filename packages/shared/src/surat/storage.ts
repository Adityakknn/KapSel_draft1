import fs from "node:fs/promises";
import path from "node:path";
import { sharedConfig } from "../config.js";

export async function ensureStorageDir(): Promise<string> {
  const dir = path.join(sharedConfig.storageDir, "permohonan");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function draftPath(nomorPermohonan: string, ext: "docx" | "pdf"): Promise<string> {
  const dir = await ensureStorageDir();
  return path.join(dir, `${nomorPermohonan}.${ext}`);
}

export function templateFilePath(templateFile: string): string {
  return path.join(sharedConfig.templatesDir, templateFile);
}
