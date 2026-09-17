"use client";

import { apiGet } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { ActivityLogEntry, Pagination } from "@/lib/types";
import { Card, PageHeading } from "@/components/Card";

const AKSI_LABEL: Record<string, string> = {
  APPROVE_PERMOHONAN: "Menyetujui permohonan",
  REJECT_PERMOHONAN: "Menolak permohonan",
};

export default function ActivityLogPage() {
  const { data, loading, error } = useApi(() =>
    apiGet<{ items: ActivityLogEntry[]; pagination: Pagination }>("/api/admin/activity-log?limit=50")
  );

  return (
    <div>
      <PageHeading title="Log Aktivitas" description="Riwayat aksi admin untuk akuntabilitas." />

      {error && <p className="text-sm text-cardinal mb-4">{error}</p>}

      <Card className="divide-y divide-border">
        {loading && <p className="px-4 py-4 text-sm text-ink-muted">Memuat...</p>}
        {data?.items.length === 0 && <p className="px-4 py-4 text-sm text-ink-muted">Belum ada aktivitas.</p>}
        {data?.items.map((log) => (
          <div key={log.id} className="px-4 py-3 flex items-start justify-between gap-4 text-sm">
            <div>
              <p className="text-ink">
                <span className="font-medium">{log.adminUser.nama}</span>{" "}
                {AKSI_LABEL[log.aksi] ?? log.aksi.toLowerCase().replace(/_/g, " ")}
                {log.permohonan && (
                  <>
                    {" "}
                    <span className="font-mono text-xs text-ink-muted">{log.permohonan.nomorPermohonan}</span>
                  </>
                )}
              </p>
              {log.catatan && <p className="text-ink-muted mt-0.5">&ldquo;{log.catatan}&rdquo;</p>}
            </div>
            <span className="text-ink-muted shrink-0">{new Date(log.createdAt).toLocaleString("id-ID")}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
