/**
 * Manage the team whitelist from the command line.
 *
 * Add an email:
 *   npx tsx scripts/whitelist.ts add anish@lucidly.app "Co-founder"
 *
 * Remove an email:
 *   npx tsx scripts/whitelist.ts remove anish@lucidly.app
 *
 * List all:
 *   npx tsx scripts/whitelist.ts list
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [cmd, email, note] = process.argv.slice(2);

  if (cmd === "list") {
    const rows = await prisma.whitelist.findMany({ orderBy: { createdAt: "asc" } });
    console.table(rows.map((r: any) => ({ email: r.email, note: r.note })));
    return;
  }

  if (!email) {
    console.error("usage:\n  whitelist.ts add <email> [note]\n  whitelist.ts remove <email>\n  whitelist.ts list");
    process.exit(1);
  }

  const e = email.toLowerCase();

  if (cmd === "add") {
    const row = await prisma.whitelist.upsert({
      where: { email: e },
      update: { note: note ?? null },
      create: { email: e, note: note ?? null },
    });
    console.log("added/updated:", row);
  } else if (cmd === "remove") {
    await prisma.whitelist.delete({ where: { email: e } });
    console.log("removed:", e);
  } else {
    console.error("unknown command:", cmd);
    process.exit(1);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
