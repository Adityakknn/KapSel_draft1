import "dotenv/config";
import { prisma } from "shared";
import { hashPassword } from "../lib/password.js";

/**
 * Bootstrap akun admin pertama (superadmin), sekali dijalankan manual dari terminal.
 * Setelah ada 1 superadmin, akun lain dibuat lewat dashboard (POST /api/admin/users).
 *
 * Usage: npm run create-admin --workspace=apps/api -- <email> <password> "<nama>"
 */
async function main() {
  const [email, password, nama = "Admin Desa"] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: npm run create-admin --workspace=apps/api -- <email> <password> "<nama>"');
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Password minimal 8 karakter.");
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.error(`Email ${email} sudah terdaftar sebagai admin.`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminUser.create({
    data: { email, nama, passwordHash, peran: "SUPERADMIN" },
  });

  console.log(`Superadmin dibuat: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((err) => {
    console.error("Gagal membuat admin:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
