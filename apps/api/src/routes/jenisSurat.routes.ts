import { Router } from "express";
import { prisma } from "shared";
import { asyncHandler } from "../lib/asyncHandler.js";
import { ok } from "../lib/apiResponse.js";

export const jenisSuratRouter = Router();

/** Daftar jenis surat aktif + struktur field-nya, dipakai Website Publik untuk render form dinamis. */
jenisSuratRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const daftar = await prisma.jenisSurat.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
      include: { fields: { orderBy: { urutan: "asc" } } },
    });

    const data = daftar.map((j) => ({
      kode: j.kode,
      nama: j.nama,
      deskripsi: j.deskripsi,
      fields: j.fields.map((f) => ({
        key: f.key,
        label: f.label,
        tipe: f.tipe,
        wajib: f.wajib,
        urutan: f.urutan,
        opsi: f.opsi ? f.opsi.split("|").map((s) => s.trim()) : undefined,
      })),
    }));

    ok(res, data);
  })
);
