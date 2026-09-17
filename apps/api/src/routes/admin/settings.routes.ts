import { Router } from "express";
import { z } from "zod";
import { prisma, validatePhone } from "shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ok } from "../../lib/apiResponse.js";
import { AppError } from "../../lib/AppError.js";
import { requireAdmin } from "../../middleware/auth.js";

export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAdmin);

// ---------- FAQ (dipakai chatbot menu "Info Layanan") ----------

const faqSchema = z.object({
  pertanyaan: z.string().trim().min(1),
  jawaban: z.string().trim().min(1),
  kategori: z.string().trim().optional(),
  urutan: z.number().int().default(0),
  aktif: z.boolean().default(true),
});

adminSettingsRouter.get(
  "/faq",
  asyncHandler(async (_req, res) => {
    ok(res, await prisma.faqEntry.findMany({ orderBy: { urutan: "asc" } }));
  })
);

adminSettingsRouter.post(
  "/faq",
  asyncHandler(async (req, res) => {
    const body = faqSchema.parse(req.body);
    ok(res, await prisma.faqEntry.create({ data: body }), 201);
  })
);

adminSettingsRouter.put(
  "/faq/:id",
  asyncHandler(async (req, res) => {
    const body = faqSchema.partial().parse(req.body);
    const existing = await prisma.faqEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "FAQ tidak ditemukan.");
    ok(res, await prisma.faqEntry.update({ where: { id: req.params.id }, data: body }));
  })
);

adminSettingsRouter.delete(
  "/faq/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.faqEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "FAQ tidak ditemukan.");
    await prisma.faqEntry.delete({ where: { id: req.params.id } });
    ok(res, { deleted: true });
  })
);

// ---------- Nomor admin penerima notifikasi WA ----------

const notifikasiAdminSchema = z.object({
  nomorWa: z.string().trim().min(1),
  nama: z.string().trim().min(1),
  aktif: z.boolean().default(true),
});

adminSettingsRouter.get(
  "/notifikasi-admin",
  asyncHandler(async (_req, res) => {
    ok(res, await prisma.notifikasiAdmin.findMany({ orderBy: { createdAt: "asc" } }));
  })
);

adminSettingsRouter.post(
  "/notifikasi-admin",
  asyncHandler(async (req, res) => {
    const body = notifikasiAdminSchema.parse(req.body);
    const cek = validatePhone(body.nomorWa);
    if (!cek.valid) throw new AppError(400, cek.error ?? "Nomor WA tidak valid.");

    const existing = await prisma.notifikasiAdmin.findUnique({ where: { nomorWa: body.nomorWa } });
    if (existing) throw new AppError(409, "Nomor WA ini sudah terdaftar.");

    ok(res, await prisma.notifikasiAdmin.create({ data: body }), 201);
  })
);

adminSettingsRouter.put(
  "/notifikasi-admin/:id",
  asyncHandler(async (req, res) => {
    const body = notifikasiAdminSchema.partial().parse(req.body);
    if (body.nomorWa) {
      const cek = validatePhone(body.nomorWa);
      if (!cek.valid) throw new AppError(400, cek.error ?? "Nomor WA tidak valid.");
    }
    const existing = await prisma.notifikasiAdmin.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Nomor admin tidak ditemukan.");
    ok(res, await prisma.notifikasiAdmin.update({ where: { id: req.params.id }, data: body }));
  })
);

adminSettingsRouter.delete(
  "/notifikasi-admin/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.notifikasiAdmin.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Nomor admin tidak ditemukan.");
    await prisma.notifikasiAdmin.delete({ where: { id: req.params.id } });
    ok(res, { deleted: true });
  })
);

// ---------- Pengaturan umum (key-value, mis. nama_kepala_desa) ----------

const umumSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().trim(),
});

adminSettingsRouter.get(
  "/umum",
  asyncHandler(async (_req, res) => {
    ok(res, await prisma.pengaturanUmum.findMany({ orderBy: { key: "asc" } }));
  })
);

adminSettingsRouter.put(
  "/umum",
  asyncHandler(async (req, res) => {
    const body = umumSchema.parse(req.body);
    ok(
      res,
      await prisma.pengaturanUmum.upsert({
        where: { key: body.key },
        update: { value: body.value },
        create: body,
      })
    );
  })
);
