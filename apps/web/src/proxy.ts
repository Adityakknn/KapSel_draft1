import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "elayan_admin_token";

/**
 * Optimistic check saja (baca cookie, tidak verifikasi JWT-nya - itu tugas apps/api di
 * tiap request). Tujuannya cuma bounce cepat kalau jelas-jelas belum ada cookie sama sekali,
 * supaya tidak render shell dashboard admin dulu baru redirect. Enforcement sesungguhnya
 * tetap di API (lihat apps/api/src/middleware/auth.ts) dan di client (lihat
 * ProtectedAdminLayout) - proxy TIDAK BOLEH jadi satu-satunya lapisan keamanan.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  if (!isAdminRoute) return NextResponse.next();

  const hasCookie = req.cookies.has(ADMIN_COOKIE_NAME);
  if (!hasCookie) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
