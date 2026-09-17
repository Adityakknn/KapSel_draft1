import { validateByFieldType, sanitizeText, type JenisSuratField } from "shared";
import { AppError } from "./AppError.js";

/**
 * Validasi payload form dinamis dari website terhadap definisi JenisSuratField di DB -
 * field yang sama & aturan yang sama seperti dipakai alur chatbot (lihat packages/shared/src/validation.ts),
 * supaya submit lewat WA maupun website diperlakukan sama ketatnya. Mengumpulkan SEMUA error
 * sekaligus (bukan berhenti di error pertama) supaya form web bisa menampilkan semuanya ke warga.
 */
export function validateAndBuildData(
  fields: JenisSuratField[],
  rawData: unknown
): Record<string, string> {
  if (typeof rawData !== "object" || rawData === null || Array.isArray(rawData)) {
    throw new AppError(400, "Field 'data' harus berupa object.");
  }

  const input = rawData as Record<string, unknown>;
  const result: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const rawValue = input[field.key];
    const value = typeof rawValue === "string" ? rawValue : rawValue == null ? "" : String(rawValue);

    if (!value.trim()) {
      if (field.wajib) errors[field.key] = `${field.label} wajib diisi.`;
      continue;
    }

    const opsi = field.opsi ? field.opsi.split("|").map((s) => s.trim()) : undefined;
    const hasil = validateByFieldType(field.tipe, value, { label: field.label, options: opsi });
    if (!hasil.valid) {
      errors[field.key] = hasil.error ?? `${field.label} tidak valid.`;
      continue;
    }

    result[field.key] = sanitizeText(value.trim());
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError(400, "Ada isian yang tidak valid.", { fields: errors });
  }

  return result;
}
