import { Router } from "express";
import { z } from "zod";
import { prisma, generateSurat, validatePhone } from "shared";
import { asyncHandler } from "../lib/asyncHandler.js";
import { ok } from "../lib/apiResponse.js";
import { AppError } from "../lib/AppError.js";
import { validateAndBuildData } from "../lib/validatePermohonanData.js";
import { notifyAdminViaWaBot } from "../notify/notifyWaBot.js";

export const permohonanRouter = Router();

const submitSchema = z.object({
  jenisSuratKode: z.string().min(1, "jenisSuratKode wajib diisi"),
  data: z.record(z.unknown()),
  kontakWa: z.string().trim().optional(),
});

/** Submit permohonan baru dari Website Publik. Validasi server-side penuh - tidak percaya validasi client. */
permohonanRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = submitSchema.parse(req.body);

    const jenisSurat = await prisma.jenisSurat.findUnique({
      where: { kode: body.jenisSuratKode },
      include: { fields: { orderBy: { urutan: "asc" } } },
    });

    if (!jenisSurat || !jenisSurat.aktif) {
      throw new AppError(404, "Jenis surat tidak ditemukan atau sedang tidak tersedia.");
    }

    let nomorWaPemohon: string | undefined;
    if (body.kontakWa) {
      const cek = validatePhone(body.kontakWa);
      if (!cek.valid) throw new AppError(400, cek.error ?? "Nomor WA kontak tidak valid.");
      nomorWaPemohon = body.kontakWa.trim();
    }

    const data = validateAndBuildData(jenisSurat.fields, body.data);

    const { permohonan } = await generateSurat({
      jenisSurat,
      data,
      sumberKanal: "WEBSITE",
      nomorWaPemohon,
    });

    await notifyAdminViaWaBot(permohonan.id);

    ok(
      res,
      {
        nomorPermohonan: permohonan.nomorPermohonan,
        jenisSurat: jenisSurat.nama,
        status: permohonan.status,
      },
      201
    );
  })
);

/**
 * Cek status - PUBLIK, siapa saja yang tahu nomor permohonan bisa akses.
 * JANGAN pernah kembalikan dataPemohon (NIK, alamat, dll) di sini.
 */
permohonanRouter.get(
  "/:nomor",
  asyncHandler(async (req, res) => {
    const nomor = req.params.nomor.toUpperCase();
    const permohonan = await prisma.permohonan.findUnique({
      where: { nomorPermohonan: nomor },
      include: { jenisSurat: { select: { nama: true } } },
    });

    if (!permohonan) {
      throw new AppError(404, `Permohonan dengan nomor ${nomor} tidak ditemukan.`);
    }

    ok(res, {
      nomorPermohonan: permohonan.nomorPermohonan,
      jenisSurat: permohonan.jenisSurat.nama,
      status: permohonan.status,
      catatanAdmin: permohonan.catatanAdmin,
      diajukanPada: permohonan.createdAt,
    });
  })
);
