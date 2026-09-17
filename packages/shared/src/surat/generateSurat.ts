import fs from "node:fs/promises";
import { promisify } from "node:util";
import libre from "libreoffice-convert";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { prisma } from "../db.js";
import { generateNomorPermohonan } from "../nomorPermohonan.js";
import { logger } from "../logger.js";
import { draftPath, templateFilePath } from "./storage.js";
import type { JenisSurat, Permohonan, SumberKanal } from "@prisma/client";

const convertAsync = promisify(libre.convert);

export interface GenerateSuratParams {
  jenisSurat: JenisSurat;
  data: Record<string, string>;
  sumberKanal: SumberKanal;
  nomorWaPemohon?: string;
}

export interface GenerateSuratResult {
  permohonan: Permohonan;
  /** true kalau draft dokumen (docx/pdf) berhasil dibuat & tersimpan, bukan cuma record DB. */
  dokumenTerbuat: boolean;
}

function tanggalIndonesia(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(
    date
  );
}

async function getNamaKepalaDesa(): Promise<string> {
  const setting = await prisma.pengaturanUmum.findUnique({ where: { key: "nama_kepala_desa" } });
  return setting?.value ?? "(Nama Kepala Desa)";
}

async function renderDocx(templatePath: string, data: Record<string, unknown>): Promise<Buffer> {
  const content = await fs.readFile(templatePath);
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  return doc.getZip().generate({ type: "nodebuffer" });
}

/**
 * Dipakai bersama oleh wa-bot (pengajuan lewat chat) dan api (pengajuan lewat website) -
 * satu implementasi supaya perilaku & format surat konsisten di semua kanal.
 *
 * Membuat record Permohonan terlebih dahulu (supaya permohonan warga SELALU tercatat untuk
 * ditindaklanjuti admin secara manual bila perlu), lalu mencoba membuat draft dokumen
 * (docx -> pdf) sebagai best-effort. Kegagalan pada tahap dokumen TIDAK dianggap kegagalan
 * pengajuan - hanya dicatat di log untuk ditindaklanjuti admin.
 */
export async function generateSurat(params: GenerateSuratParams): Promise<GenerateSuratResult> {
  const nomorPermohonan = await generateNomorPermohonan(prisma, params.jenisSurat.kode);

  const permohonan = await prisma.permohonan.create({
    data: {
      nomorPermohonan,
      jenisSuratId: params.jenisSurat.id,
      sumberKanal: params.sumberKanal,
      nomorWaPemohon: params.nomorWaPemohon,
      dataPemohon: params.data,
      status: "MENUNGGU_VERIFIKASI",
    },
  });

  let dokumenTerbuat = false;

  try {
    const templateData = {
      ...params.data,
      nomorSurat: nomorPermohonan,
      tanggalSurat: tanggalIndonesia(new Date()),
      namaKepalaDesa: await getNamaKepalaDesa(),
    };

    const docxBuffer = await renderDocx(templateFilePath(params.jenisSurat.templateFile), templateData);
    const docxPath = await draftPath(nomorPermohonan, "docx");
    await fs.writeFile(docxPath, docxBuffer);

    let finalDraftPath = docxPath;
    try {
      const pdfBuffer = (await convertAsync(docxBuffer, ".pdf", undefined)) as Buffer;
      const pdfPath = await draftPath(nomorPermohonan, "pdf");
      await fs.writeFile(pdfPath, pdfBuffer);
      finalDraftPath = pdfPath;
    } catch (pdfErr) {
      logger.warn(
        { err: pdfErr, nomorPermohonan },
        "Gagal convert draft surat ke PDF (LibreOffice mungkin belum terpasang di server) - draft .docx tetap tersimpan untuk admin"
      );
    }

    await prisma.permohonan.update({
      where: { id: permohonan.id },
      data: { fileDraftPath: finalDraftPath },
    });
    dokumenTerbuat = true;
  } catch (err) {
    logger.error(
      { err, nomorPermohonan },
      "Gagal membuat draft dokumen surat otomatis - permohonan tetap tercatat untuk diproses manual oleh admin"
    );
  }

  return { permohonan, dokumenTerbuat };
}
