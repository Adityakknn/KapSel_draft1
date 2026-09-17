function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Environment variable ${name} wajib diisi (lihat apps/api/.env.example). Server tidak dijalankan.`
    );
  }
  return v;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: envInt("PORT", 4000),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  cookieName: "elayan_admin_token",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  internalWaBotUrl: process.env.INTERNAL_WA_BOT_URL ?? "http://127.0.0.1:4001",
  internalApiKey: process.env.INTERNAL_API_KEY ?? "",
};
