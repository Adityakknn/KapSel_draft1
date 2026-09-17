import type { StatusPermohonan } from "shared/types";

const STYLE: Record<StatusPermohonan, string> = {
  MENUNGGU_VERIFIKASI: "bg-amber-50 text-amber-800 border-amber-200",
  DISETUJUI: "bg-emerald-50 text-emerald-800 border-emerald-200",
  DITOLAK: "bg-cardinal/5 text-cardinal border-cardinal/20",
  SELESAI: "bg-sky-50 text-sky-800 border-sky-200",
};

const LABEL: Record<StatusPermohonan, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
};

export function StatusBadge({ status }: { status: StatusPermohonan }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLE[status]}`}
    >
      {LABEL[status]}
    </span>
  );
}
