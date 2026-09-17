"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PerananAdmin } from "shared/types";
import { apiGet, apiPost } from "./api";

export interface AdminUser {
  id: string;
  email: string;
  nama: string;
  peran: PerananAdmin;
}

interface AuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await apiGet<AdminUser>("/api/admin/me");
      setAdmin(me);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch sesi admin saat mount - state hanya di-set di dalam callback async
    // setelah request selesai, bukan sinkron di body efek.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiPost<AdminUser>("/api/admin/login", { email, password });
    setAdmin(result);
  }, []);

  const logout = useCallback(async () => {
    await apiPost("/api/admin/logout");
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
