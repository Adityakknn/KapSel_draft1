import type { Prisma } from "shared";

/** Efek samping yang butuh akses socket WA - dieksekusi router SETELAH balasan ke warga terkirim. */
export type FlowSideEffect = { type: "NOTIFY_ADMIN_PERMOHONAN_BARU"; permohonanId: string };

/** Hasil pemrosesan satu langkah alur: pesan balasan + state/context berikutnya untuk disimpan. */
export interface FlowResult {
  replies: string[];
  nextState: string;
  nextContext: Prisma.InputJsonValue;
  sideEffects?: FlowSideEffect[];
}

export interface FlowContext {
  nomorWa: string; // format 62xxxxxxxxxxx, tanpa @s.whatsapp.net
  text: string; // pesan warga, sudah di-trim
  contextData: Record<string, unknown>;
}

export function reply(
  replies: string | string[],
  nextState: string,
  nextContext: Record<string, unknown> = {},
  sideEffects?: FlowSideEffect[]
): FlowResult {
  return {
    replies: Array.isArray(replies) ? replies : [replies],
    nextState,
    nextContext: nextContext as Prisma.InputJsonValue,
    sideEffects,
  };
}
