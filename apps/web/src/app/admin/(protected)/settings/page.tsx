"use client";

import { useState } from "react";
import { PageHeading } from "@/components/Card";
import { FaqTab } from "@/components/settings/FaqTab";
import { NotifikasiAdminTab } from "@/components/settings/NotifikasiAdminTab";
import { PengaturanUmumTab } from "@/components/settings/PengaturanUmumTab";
import { AdminUsersTab } from "@/components/settings/AdminUsersTab";

const TABS = [
  { key: "faq", label: "FAQ Chatbot" },
  { key: "notifikasi", label: "Nomor Notifikasi Admin" },
  { key: "umum", label: "Pengaturan Umum" },
  { key: "akun", label: "Akun Admin" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>("faq");

  return (
    <div>
      <PageHeading title="Pengaturan" description="Kelola konten chatbot & akses dashboard tanpa perlu bantuan programmer." />

      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-cardinal text-cardinal" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "faq" && <FaqTab />}
      {tab === "notifikasi" && <NotifikasiAdminTab />}
      {tab === "umum" && <PengaturanUmumTab />}
      {tab === "akun" && <AdminUsersTab />}
    </div>
  );
}
