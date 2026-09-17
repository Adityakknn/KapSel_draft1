"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const { admin, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && admin) {
      router.replace("/admin");
    }
  }, [loading, admin, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal login. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-section flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-serif text-lg font-semibold text-ink">E-Layan Desa</p>
          <p className="text-sm text-ink-muted">Sabah Balau</p>
        </div>

        <div className="bg-white border border-border rounded-sm shadow-sm">
          <div className="border-t-2 border-cardinal rounded-t-sm" />
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <h1 className="font-serif text-xl font-semibold text-ink">Masuk Dashboard Admin</h1>
              <p className="text-sm text-ink-muted mt-1">Khusus perangkat desa yang terdaftar.</p>
            </div>

            {error && (
              <p className="text-sm bg-cardinal/5 border border-cardinal/20 text-cardinal px-3 py-2 rounded-sm">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/40 focus:border-cardinal"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/40 focus:border-cardinal"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-cardinal hover:bg-cardinal-dark disabled:opacity-60 text-white text-sm font-medium rounded-sm py-2.5 transition-colors"
            >
              {submitting ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
