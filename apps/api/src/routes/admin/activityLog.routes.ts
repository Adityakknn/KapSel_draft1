import { Router } from "express";
import { z } from "zod";
import { prisma } from "shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ok } from "../../lib/apiResponse.js";
import { requireAdmin } from "../../middleware/auth.js";

export const adminActivityLogRouter = Router();
adminActivityLogRouter.use(requireAdmin);

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

adminActivityLogRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = querySchema.parse(req.query);

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        include: {
          adminUser: { select: { id: true, nama: true, email: true } },
          permohonan: { select: { id: true, nomorPermohonan: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.activityLog.count(),
    ]);

    ok(res, {
      items,
      pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
    });
  })
);
