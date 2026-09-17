import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient. Di dev (tsx watch / next dev) module bisa di-reload
 * berkali-kali; simpan instance di `global` supaya tidak buka koneksi baru tiap reload.
 */
export const prisma: PrismaClient = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
