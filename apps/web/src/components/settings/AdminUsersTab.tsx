"use client";

import { useState, type FormEvent } from "react";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth-context";
import type { AdminUserEntry } from "@/lib/types";
import { Card } from "@/components/Card";

export function AdminUsersTab() {
  const { admin } = useAuth();
  const { data, loading, reload } = useApi(() => apiGet<AdminUserEntry[]>("/api/admin/users"));
  const isSuperadmin = admin?.peran === "SUPERADMIN";

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [peran, setPeran] = useState<"STAFF" | "SUPERADMIN">("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiPost("/api/admin/users", { nama, email, password, peran });
      setNama("");
      setEmail("");
      setPassword("");
      setPeran("STAFF");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah akun.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAktif(u: AdminUserEntry) {
    setError(null);
    try {
      await apiPut(`/api/admin/users/${u.id}`, { aktif: !u.aktif });
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengubah status.");
    }
  }

  async function handleDelete(u: AdminUserEntry) {
    if (!confirm(`Hapus akun "${u.nama}"?`)) return;
    setError(null);
    try {
      await apiDelete(`/api/admin/users/${u.id}`);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus akun.");
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-cardinal">{error}</p>}

      <Card className="divide-y divide-border">
        {loading && <p className="px-4 py-4 text-sm text-ink-muted">Memuat...</p>}
        {data?.map((u) => (
          <div key={u.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">
                {u.nama} {u.id === admin?.id && <span className="text-xs text-ink-muted">(kamu)</span>}
              </p>
              <p className="text-sm text-ink-muted">
                {u.email} · {u.peran === "SUPERADMIN" ? "Superadmin" : "Staf"}
              </p>
            </div>
            {isSuperadmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleAktif(u)}
                  className={`text-xs rounded-full px-2.5 py-0.5 border ${
                    u.aktif ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-section text-ink-muted border-border"
                  }`}
                >
                  {u.aktif ? "Aktif" : "Nonaktif"}
                </button>
                {u.id !== admin?.id && (
                  <button onClick={() => handleDelete(u)} className="text-ink-muted hover:text-cardinal text-sm">
                    Hapus
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </Card>

      {isSuperadmin && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Tambah Akun Admin</h3>
          <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-3">
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama"
              required
              className="border border-border rounded-sm px-3 py-2 text-sm"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              required
              className="border border-border rounded-sm px-3 py-2 text-sm"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password (min. 8 karakter)"
              required
              minLength={8}
              className="border border-border rounded-sm px-3 py-2 text-sm"
            />
            <select
              value={peran}
              onChange={(e) => setPeran(e.target.value as "STAFF" | "SUPERADMIN")}
              className="border border-border rounded-sm px-3 py-2 text-sm"
            >
              <option value="STAFF">Staf</option>
              <option value="SUPERADMIN">Superadmin</option>
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="md:col-span-2 bg-cardinal hover:bg-cardinal-dark disabled:opacity-60 text-white text-sm font-medium rounded-sm px-4 py-2 w-fit"
            >
              Tambah Akun
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
