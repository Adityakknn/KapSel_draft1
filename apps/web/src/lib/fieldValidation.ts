import type { TipeField } from "shared/types";

export interface FieldValidationResult {
  valid: boolean;
  error?: string;
}

const ok: FieldValidationResult = { valid: true };
const fail = (error: string): FieldValidationResult => ({ valid: false, error });

/**
 * Mirror dari packages/shared/src/validation.ts untuk feedback instan di browser saat warga
 * mengetik. Bukan sumber kebenaran - apps/api selalu validasi ulang di server sebelum simpan,
 * jadi kalau dua sisi ini pernah tidak sinkron, server yang menang.
 */
export function validateNikClient(input: string): FieldValidationResult {
  return /^\d{16}$/.test(input.trim())
    ? ok
    : fail("NIK harus berupa 16 digit angka. Contoh: 1871234567890001");
}

export function validatePhoneClient(input: string): FieldValidationResult {
  const v = input.trim().replace(/[\s-]/g, "");
  return /^(\+?62|0)8\d{8,11}$/.test(v)
    ? ok
    : fail("Nomor HP tidak valid. Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx.");
}

export function validateDateClient(input: string): FieldValidationResult {
  const v = input.trim();
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(v);
  if (!m) return fail("Format tanggal harus DD-MM-YYYY, contoh: 17-09-2026.");
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate ? ok : fail("Tanggal tidak valid.");
}

export function validateByFieldTypeClient(
  tipe: TipeField,
  input: string,
  opts: { label?: string; options?: string[] } = {}
): FieldValidationResult {
  const v = input.trim();
  switch (tipe) {
    case "NIK":
      return validateNikClient(v);
    case "TELEPON":
      return validatePhoneClient(v);
    case "DATE":
      return validateDateClient(v);
    case "NUMBER":
      return /^\d+$/.test(v) ? ok : fail(`${opts.label ?? "Isian"} harus berupa angka.`);
    case "SELECT": {
      const options = opts.options ?? [];
      return options.includes(v)
        ? ok
        : fail(`Pilihan tidak valid. Pilih salah satu: ${options.join(", ")}`);
    }
    case "TEXTAREA":
      if (v.length < 3) return fail(`${opts.label ?? "Isian"} terlalu pendek, minimal 3 karakter.`);
      if (v.length > 1000)
        return fail(`${opts.label ?? "Isian"} terlalu panjang, maksimal 1000 karakter.`);
      return ok;
    case "TEXT":
    default:
      if (v.length < 1) return fail(`${opts.label ?? "Isian"} wajib diisi.`);
      if (v.length > 200) return fail(`${opts.label ?? "Isian"} terlalu panjang, maksimal 200 karakter.`);
      return ok;
  }
}
