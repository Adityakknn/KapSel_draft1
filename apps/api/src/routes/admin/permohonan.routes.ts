import { Router } from "express";
import { z } from "zod";
import { prisma, type Prisma, type StatusPermohonan } from "shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ok } from "../../lib/apiResponse.js";
import { AppError } from "../../lib/AppError.js";
import { requireAdmin } from "../../middleware/auth.js";
import { kirimSuratViaWaBot } from "../../notify/notifyWaBot.js";

export const adminPermohonanRouter = Router();
adminPermohonanRouter.use(requireAdmin);

const listQuerySchema = z.object({
  status: z.enum(["MENUNGGU_VERIFIKASI", "DISETUJUI", "DITOLAK", "SELESAI"]).optional(),
  jenisSuratKode: z.string().optional(),
  dari: z.string().datetime().optional(),
  sampai: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

adminPermohonanRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = listQuerySchema.parse(req.query);

    const where: Prisma.PermohonanWhereInput = {
      status: q.status,
      jenisSurat: q.jenisSuratKode ? { kode: q.jenisSuratKode } : undefined,
      createdAt:
        q.dari || q.sampai
          ? { gte: q.dari ? new Date(q.dari) : undefined, lte: q.sampai ? new Date(q.sampai) : undefined }
          : undefined,
    };

    const [items, total] = await Promise.all([
      prisma.permohonan.findMany({
        where,
        include: { jenisSurat: { select: { nama: true, kode: true } } },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.permohonan.count({ where }),
    ]);

    ok(res, {
      items: items.map((p) => ({
        id: p.id,
        nomorPermohonan: p.nomorPermohonan,
        jenisSurat: p.jenisSurat,
        sumberKanal: p.sumberKanal,
        status: p.status,
        createdAt: p.createdAt,
      })),
      pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
    });
  })
);

/** Ringkasan jumlah permohonan per status - dipakai dashboard utama. */
adminPermohonanRouter.get(
  "/ringkasan",
  asyncHandler(async (_req, res) => {
    const grouped = await prisma.permohonan.groupBy({ by: ["status"], _count: { _all: true } });
    const ringkasan: Record<StatusPermohonan, number> = {
      MENUNGGU_VERIFIKASI: 0,
      DISETUJUI: 0,
      DITOLAK: 0,
      SELESAI: 0,
    };
    for (const g of grouped) ringkasan[g.status] = g._count._all;
    ok(res, ringkasan);
  })
);

adminPermohonanRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const permohonan = await prisma.permohonan.findUnique({
      where: { id: req.params.id },
      include: { jenisSurat: true, diprosesOleh: { select: { id: true, nama: true, email: true } } },
    });
    if (!permohonan) throw new AppError(404, "Permohonan tidak ditemukan.");
    ok(res, permohonan);
  })
);

const verifikasiSchema = z.object({
  aksi: z.enum(["APPROVE", "REJECT"]),
  catatan: z.string().trim().max(1000).optional(),
});

adminPermohonanRouter.post(
  "/:id/verifikasi",
  asyncHandler(async (req, res) => {
    const { aksi, catatan } = verifikasiSchema.parse(req.body);
    const admin = req.admin!;

    const permohonan = await prisma.permohonan.findUnique({ where: { id: req.params.id } });
    if (!permohonan) throw new AppError(404, "Permohonan tidak ditemukan.");
    if (permohonan.status !== "MENUNGGU_VERIFIKASI") {
      throw new AppError(409, `Permohonan ini sudah diproses sebelumnya (status: ${permohonan.status}).`);
    }

    const statusBaru: StatusPermohonan = aksi === "APPROVE" ? "DISETUJUI" : "DITOLAK";

    let updated = await prisma.permohonan.update({
      where: { id: permohonan.id },
      data: {
        status: statusBaru,
        catatanAdmin: catatan,
        diprosesOlehId: admin.id,
        diprosesPadaAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        adminUserId: admin.id,
        aksi: aksi === "APPROVE" ? "APPROVE_PERMOHONAN" : "REJECT_PERMOHONAN",
        permohonanId: permohonan.id,
        catatan,
      },
    });

    let terkirimKeWarga = false;
    if (aksi === "APPROVE") {
      terkirimKeWarga = await kirimSuratViaWaBot(permohonan.id);
      if (terkirimKeWarga) {
        updated = await prisma.permohonan.update({
          where: { id: permohonan.id },
          data: { status: "SELESAI" },
        });
      }
    }

    ok(res, { permohonan: updated, terkirimKeWarga });
  })
);
