import { Router } from "express";
import { z } from "zod";
import { prisma } from "shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ok } from "../../lib/apiResponse.js";
import { AppError } from "../../lib/AppError.js";
import { requireAdmin, requireRole } from "../../middleware/auth.js";
import { hashPassword } from "../../lib/password.js";

export const adminUsersRouter = Router();
adminUsersRouter.use(requireAdmin);

const SELECT_SAFE = { id: true, email: true, nama: true, peran: true, aktif: true, createdAt: true } as const;

adminUsersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    ok(res, await prisma.adminUser.findMany({ select: SELECT_SAFE, orderBy: { createdAt: "asc" } }));
  })
);

const createSchema = z.object({
  email: z.string().trim().email(),
  nama: z.string().trim().min(1),
  password: z.string().min(8, "Password minimal 8 karakter"),
  peran: z.enum(["SUPERADMIN", "STAFF"]).default("STAFF"),
});

adminUsersRouter.post(
  "/",
  requireRole("SUPERADMIN"),
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const existing = await prisma.adminUser.findUnique({ where: { email: body.email } });
    if (existing) throw new AppError(409, "Email ini sudah terdaftar sebagai admin.");

    const passwordHash = await hashPassword(body.password);
    const admin = await prisma.adminUser.create({
      data: { email: body.email, nama: body.nama, peran: body.peran, passwordHash },
      select: SELECT_SAFE,
    });
    ok(res, admin, 201);
  })
);

const updateSchema = z.object({
  nama: z.string().trim().min(1).optional(),
  peran: z.enum(["SUPERADMIN", "STAFF"]).optional(),
  aktif: z.boolean().optional(),
});

adminUsersRouter.put(
  "/:id",
  requireRole("SUPERADMIN"),
  asyncHandler(async (req, res) => {
    const body = updateSchema.parse(req.body);
    const target = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!target) throw new AppError(404, "Admin tidak ditemukan.");

    if ((body.aktif === false || body.peran === "STAFF") && target.peran === "SUPERADMIN") {
      const activeSuperadmins = await prisma.adminUser.count({
        where: { peran: "SUPERADMIN", aktif: true },
      });
      if (activeSuperadmins <= 1) {
        throw new AppError(409, "Tidak bisa menonaktifkan/menurunkan peran superadmin aktif terakhir.");
      }
    }

    ok(res, await prisma.adminUser.update({ where: { id: target.id }, data: body, select: SELECT_SAFE }));
  })
);

const changePasswordSchema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter"),
});

/** Ganti password akun sendiri, atau siapa saja kalau yang login SUPERADMIN. */
adminUsersRouter.put(
  "/:id/password",
  asyncHandler(async (req, res) => {
    const admin = req.admin!;
    if (req.params.id !== admin.id && admin.peran !== "SUPERADMIN") {
      throw new AppError(403, "Kamu hanya bisa mengganti password akun sendiri.");
    }

    const { password } = changePasswordSchema.parse(req.body);
    const target = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!target) throw new AppError(404, "Admin tidak ditemukan.");

    const passwordHash = await hashPassword(password);
    await prisma.adminUser.update({ where: { id: target.id }, data: { passwordHash } });
    ok(res, { updated: true });
  })
);

adminUsersRouter.delete(
  "/:id",
  requireRole("SUPERADMIN"),
  asyncHandler(async (req, res) => {
    const admin = req.admin!;
    if (req.params.id === admin.id) {
      throw new AppError(400, "Tidak bisa menghapus akun sendiri.");
    }

    const target = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!target) throw new AppError(404, "Admin tidak ditemukan.");

    if (target.peran === "SUPERADMIN") {
      const activeSuperadmins = await prisma.adminUser.count({
        where: { peran: "SUPERADMIN", aktif: true },
      });
      if (activeSuperadmins <= 1) {
        throw new AppError(409, "Tidak bisa menghapus superadmin aktif terakhir.");
      }
    }

    await prisma.adminUser.delete({ where: { id: target.id } });
    ok(res, { deleted: true });
  })
);
