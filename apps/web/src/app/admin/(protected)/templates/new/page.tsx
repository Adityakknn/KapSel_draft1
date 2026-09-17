import { PageHeading } from "@/components/Card";
import { TemplateForm } from "@/components/TemplateForm";

export default function NewTemplatePage() {
  return (
    <div>
      <PageHeading title="Tambah Jenis Surat" description="Definisikan field & unggah template .docx." />
      <TemplateForm />
    </div>
  );
}
