import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma, sharedConfig } from "shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ok } from "../../lib/apiResponse.js";
import { AppError } from "../../lib/AppError.js";
import { requireAdmin } from "../../middleware/auth.js";

export const adminTemplatesRouter = Router();
adminTemplatesRouter.use(requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okType =
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname.toLowerCase().endsWith(".docx");
    if (!okType) {
      cb(new AppError(400, "File template harus berformat .docx"));
      return;
    }
    cb(null, true);
  },
});

const fieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "key hanya boleh huruf/angka, diawali huruf (jadi placeholder {key} di docx)"),
  label: z.string().trim().min(1),
  tipe: z.enum(["TEXT", "TEXTAREA", "NUMBER", "DATE", "NIK", "TELEPON", "SELECT"]),
  wajib: z.boolean().default(true),
  urutan: z.number().int().default(0),
  opsi: z.string().trim().optional(),
});

const createSchema = z.object({
  kode: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z][a-z0-9-]*$/, "kode hanya boleh huruf kecil/angka/strip, diawali huruf"),
  nama: z.string().trim().min(1),
  deskripsi: z.string().trim().optional(),
  fields: z.array(fieldSchema).min(1, "Minimal 1 field harus didefinisikan"),
});

const updateSchema = z.object({
  nama: z.string().trim().min(1).optional(),
  deskripsi: z.string().trim().optional(),
  aktif: z.boolean().optional(),
  fields: z.array(fieldSchema).optional(),
});

function parseFieldsJson(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError(400, "Field 'fields' harus JSON array yang valid.");
  }
}

adminTemplatesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const daftar = await prisma.jenisSurat.findMany({
      include: { fields: { orderBy: { urutan: "asc" } }, _count: { select: { permohonan: true } } },
      orderBy: { nama: "asc" },
    });
    ok(res, daftar);
  })
);

adminTemplatesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const jenisSurat = await prisma.jenisSurat.findUnique({
      where: { id: req.params.id },
      include: { fields: { orderBy: { urutan: "asc" } } },
    });
    if (!jenisSurat) throw new AppError(404, "Jenis surat tidak ditemukan.");
    ok(res, jenisSurat);
  })
);

adminTemplatesRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const body = createSchema.parse({ ...req.body, fields: parseFieldsJson(req.body.fields) });
    if (!req.file) throw new AppError(400, "File template (.docx) wajib diunggah.");

    const existing = await prisma.jenisSurat.findUnique({ where: { kode: body.kode } });
    if (existing) throw new AppError(409, `Kode jenis surat '${body.kode}' sudah dipakai.`);

    const templateFile = `${body.kode}.docx`;
    await fs.mkdir(sharedConfig.templatesDir, { recursive: true });
    await fs.writeFile(path.join(sharedConfig.templatesDir, templateFile), req.file.buffer);

    const jenisSurat = await prisma.jenisSurat.create({
      data: {
        kode: body.kode,
        nama: body.nama,
        deskripsi: body.deskripsi,
        templateFile,
        fields: { create: body.fields.map((f) => ({ ...f, opsi: f.opsi || null })) },
      },
      include: { fields: true },
    });

    ok(res, jenisSurat, 201);
  })
);

adminTemplatesRouter.put(
  "/:id",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const rawFields = req.body.fields !== undefined ? parseFieldsJson(req.body.fields) : undefined;
    const body = updateSchema.parse({
      ...req.body,
      aktif: req.body.aktif !== undefined ? req.body.aktif === "true" || req.body.aktif === true : undefined,
      fields: rawFields,
    });

    const jenisSurat = await prisma.jenisSurat.findUnique({ where: { id: req.params.id } });
    if (!jenisSurat) throw new AppError(404, "Jenis surat tidak ditemukan.");

    if (req.file) {
      await fs.mkdir(sharedConfig.templatesDir, { recursive: true });
      await fs.writeFile(path.join(sharedConfig.templatesDir, jenisSurat.templateFile), req.file.buffer);
    }

    if (body.fields) {
      // Ganti seluruh set field sekaligus - sederhana & konsisten untuk kasus edit dari dashboard.
      await prisma.jenisSuratField.deleteMany({ where: { jenisSuratId: jenisSurat.id } });
      await prisma.jenisSuratField.createMany({
        data: body.fields.map((f) => ({ ...f, opsi: f.opsi || null, jenisSuratId: jenisSurat.id })),
      });
    }

    const updated = await prisma.jenisSurat.update({
      where: { id: jenisSurat.id },
      data: { nama: body.nama, deskripsi: body.deskripsi, aktif: body.aktif },
      include: { fields: { orderBy: { urutan: "asc" } } },
    });

    ok(res, updated);
  })
);

adminTemplatesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const jenisSurat = await prisma.jenisSurat.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { permohonan: true } } },
    });
    if (!jenisSurat) throw new AppError(404, "Jenis surat tidak ditemukan.");

    if (jenisSurat._count.permohonan > 0) {
      throw new AppError(
        409,
        "Jenis surat ini sudah pernah dipakai di permohonan - tidak bisa dihapus. Nonaktifkan saja lewat PUT (aktif: false)."
      );
    }

    await prisma.jenisSurat.delete({ where: { id: jenisSurat.id } });
    ok(res, { deleted: true });
  })
);
