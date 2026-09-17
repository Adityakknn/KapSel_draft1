import { Router } from "express";
import { z } from "zod";
import { prisma } from "shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ok } from "../../lib/apiResponse.js";
import { AppError } from "../../lib/AppError.js";
import { verifyPassword } from "../../lib/password.js";
import { signAdminToken } from "../../lib/jwt.js";
import { config } from "../../config.js";
import { requireAdmin } from "../../middleware/auth.js";

export const adminAuthRouter = Router();

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

function cookieOptions() {
  return {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax" as const,
    maxAge: 8 * 60 * 60 * 1000, // 8 jam, selaras dengan JWT_EXPIRES_IN default
    path: "/",
  };
}

adminAuthRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    // Pesan error sengaja tidak membedakan "email tidak ada" vs "password salah" (cegah enumerasi akun).
    if (!admin || !admin.aktif) {
      throw new AppError(401, "Email atau password salah.");
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      throw new AppError(401, "Email atau password salah.");
    }

    const token = signAdminToken({ sub: admin.id, email: admin.email, peran: admin.peran });
    res.cookie(config.cookieName, token, cookieOptions());

    ok(res, { id: admin.id, email: admin.email, nama: admin.nama, peran: admin.peran });
  })
);

adminAuthRouter.post("/logout", (_req, res) => {
  res.clearCookie(config.cookieName, { path: "/" });
  ok(res, { loggedOut: true });
});

adminAuthRouter.get(
  "/me",
  requireAdmin,
  asyncHandler(async (req, res) => {
    ok(res, req.admin);
  })
);
