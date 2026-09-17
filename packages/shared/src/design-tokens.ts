/**
 * Design tokens E-Layan Desa Sabah Balau - editorial/institusional, terinspirasi Stanford.edu.
 * Sumber kebenaran tunggal: nilai yang sama di-mirror sebagai CSS custom properties
 * (`@theme`) di apps/web/src/app/globals.css karena Tailwind v4 membaca token dari CSS,
 * bukan dari objek JS. Import token ini di kode TS/TSX saja kalau butuh nilai mentah
 * (mis. chart, inline style) - untuk class Tailwind pakai token via `@theme` (bg-cardinal, dst).
 */
export const designTokens = {
  color: {
    cardinal: "#8C1515", // aksen utama - tombol primer, heading penting, garis pembatas
    cardinalDark: "#6E1010", // hover/active state dari cardinal
    ink: "#2E2D29", // teks gelap utama
    inkMuted: "#5B5A55", // teks sekunder/caption
    section: "#F4F4F2", // background section
    border: "#E3E1DC", // garis pembatas netral
    white: "#FFFFFF",
  },
  font: {
    headingVar: "--font-source-serif", // Source Serif 4 - heading akademik-formal
    bodyVar: "--font-source-sans", // Source Sans 3 - body, sangat mudah dibaca
  },
} as const;
