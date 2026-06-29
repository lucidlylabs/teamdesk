/**
 * One-off: reset the admin password.
 * Usage:
 *   npx tsx scripts/reset-admin-password.ts <email> <new-password>
 * Example:
 *   npx tsx scripts/reset-admin-password.ts lucidlyfinance@gmail.com 'MyNewStrongPass123!'
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, newPass] = process.argv.slice(2);
  if (!email || !newPass) {
    console.error("usage: tsx scripts/reset-admin-password.ts <email> <new-password>");
    process.exit(1);
  }
  if (newPass.length < 8) {
    console.error("new password must be at least 8 characters");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(newPass, 10);
  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { password: hashed },
    select: { id: true, email: true, role: true },
  });
  console.log("password reset:", user);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
