import { reply, type FlowContext, type FlowResult } from "./types.js";
import { STATE_MENU_UTAMA } from "../session/sessionStore.js";
import { handleInfoLayanan } from "./infoLayanan.js";
import { mulaiAjukanSurat } from "./ajukanSurat.js";
import { mulaiCekStatus } from "./cekStatus.js";

export const MENU_TEXT = [
  "*E-Layan Desa Sabah Balau* 🏛️",
  "",
  "Silakan pilih layanan dengan mengetik angka:",
  "1. Info Layanan",
  "2. Ajukan Surat",
  "3. Cek Status Permohonan",
  "",
  "_Ketik *menu* kapan saja untuk kembali ke menu ini, atau *batal* untuk membatalkan proses yang sedang berjalan._",
].join("\n");

export function sambutanAwal(): FlowResult {
  return reply(MENU_TEXT, STATE_MENU_UTAMA, {});
}

export async function handleMenuUtama(ctx: FlowContext): Promise<FlowResult> {
  switch (ctx.text.trim()) {
    case "1":
      return handleInfoLayanan();
    case "2":
      return mulaiAjukanSurat();
    case "3":
      return mulaiCekStatus();
    default:
      return reply(
        ["Maaf, pilihan tidak dikenali. Ketik angka 1, 2, atau 3 sesuai menu berikut:", MENU_TEXT],
        STATE_MENU_UTAMA
      );
  }
}
