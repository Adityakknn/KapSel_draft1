function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  sessionTimeoutMinutes: envInt("SESSION_TIMEOUT_MINUTES", 10),
  internalPort: envInt("INTERNAL_PORT", 4001),
  internalApiKey: process.env.INTERNAL_API_KEY ?? "",
};
