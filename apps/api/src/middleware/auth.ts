import type { NextFunction, Request, Response } from "express";
import { prisma, type PerananAdmin } from "shared";
import { config } from "../config.js";
import { verifyAdminToken } from "../lib/jwt.js";
import { AppError } from "../lib/AppError.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  nama: string;
  peran: PerananAdmin;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
    }
  }
}

/**
 * Wajib login sebagai admin aktif. Cek ulang status `aktif` dari DB tiap request
 * (bukan cuma percaya isi token) supaya admin yang baru dinonaktifkan langsung kehilangan akses.
 */
export const requireAdmin = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[config.cookieName];
  if (!token) {
    throw new AppError(401, "Belum login.");
  }

  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    throw new AppError(401, "Sesi login tidak valid atau sudah kedaluwarsa. Silakan login ulang.");
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
  if (!admin || !admin.aktif) {
    throw new AppError(401, "Akun tidak ditemukan atau sudah dinonaktifkan.");
  }

  req.admin = { id: admin.id, email: admin.email, nama: admin.nama, peran: admin.peran };
  next();
});

/** Batasi endpoint hanya untuk peran tertentu (dipanggil setelah requireAdmin). */
export function requireRole(...roles: PerananAdmin[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin || !roles.includes(req.admin.peran)) {
      throw new AppError(403, "Kamu tidak punya akses untuk aksi ini.");
    }
    next();
  };
}
