import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Whitelist (admin-maintained)
  const whitelist = [
    { email: "lucidlyfinance@gmail.com", note: "Founder" },
    { email: "team1@lucidly.app", note: "Eng" },
    { email: "team2@lucidly.app", note: "Research" },
  ];
  for (const w of whitelist) {
    await prisma.whitelist.upsert({
      where: { email: w.email.toLowerCase() },
      update: { note: w.note },
      create: { email: w.email.toLowerCase(), note: w.note },
    });
  }

  // Admin / sample team user
  const adminPass = await bcrypt.hash("change-me-now", 10);
  await prisma.user.upsert({
    where: { email: "lucidlyfinance@gmail.com" },
    update: {},
    create: {
      email: "lucidlyfinance@gmail.com",
      name: "Yashish",
      password: adminPass,
      role: "ADMIN",
    },
  });

  // Sample pipelines
  const pipelines = [
    { title: "TeamDesk MVP", workingRepo: "https://github.com/lucidly/teamdesk",
      summary: "Auth, calendar, Discord relay. Shipping the first locked-in loop.",
      totalTasks: 18, doneTasks: 11, status: "ACTIVE" as const },
    { title: "Lucidly Finance Engine", workingRepo: "https://github.com/lucidly/engine",
      summary: "Core ledger + reconciliation pipeline. Test coverage push this week.",
      totalTasks: 32, doneTasks: 19, status: "ACTIVE" as const },
    { title: "Research Vault", workingRepo: "https://notion.so/lucidly/vault",
      summary: "Tagged archive of every market signal we react to.",
      totalTasks: 12, doneTasks: 4, status: "PLANNED" as const },
  ];
  for (const p of pipelines) {
    const existing = await prisma.pipeline.findFirst({ where: { title: p.title } });
    if (existing) {
      await prisma.pipeline.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.pipeline.create({ data: p });
    }
  }

  // Sample research links
  const research = [
    {
      title: "Latent demand signals in retail FX",
      url: "https://example.com/research/latent-fx",
      notes: "Useful framing for our liquidity hunting work.",
      postedBy: "Yashish",
    },
    {
      title: "Why 'consistency engines' beat dashboards",
      url: "https://x.com/example/status/1",
      notes: "Direct relevance to TeamDesk's incentive design.",
      postedBy: "Yashish",
    },
  ];
  for (const r of research) {
    const existing = await prisma.research.findFirst({ where: { url: r.url } });
    if (!existing) await prisma.research.create({ data: r });
  }

  console.log("seed: done");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
