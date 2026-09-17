"use client";

import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { JenisSuratAdmin } from "@/lib/types";
import { PageHeading } from "@/components/Card";
import { TemplateForm } from "@/components/TemplateForm";

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useApi(() => apiGet<JenisSuratAdmin>(`/api/admin/templates/${id}`), [id]);

  if (loading) return <p className="text-sm text-ink-muted">Memuat...</p>;
  if (error || !data) return <p className="text-sm text-cardinal">{error ?? "Tidak ditemukan."}</p>;

  return (
    <div>
      <PageHeading title={`Edit: ${data.nama}`} description="Ubah field, status aktif, atau file template." />
      <TemplateForm existing={data} />
    </div>
  );
}
