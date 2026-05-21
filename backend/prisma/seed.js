// =============================================================================
// prisma/seed.js — Database Seeder (Plain JavaScript / CommonJS)
//
// This is the plain JS equivalent of seed.ts.
// Run with:  node prisma/seed.js
//
// Uses CommonJS require() instead of ES module import so it works with
// Node.js directly, without needing a TypeScript compilation step.
// =============================================================================

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// Prisma v7: connection URL is passed through the adapter, not schema.prisma
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Starting database seed...\n");

  // ---------------------------------------------------------------------------
  // 1. SEED: Dummy Admin User (id = 1)
  //    This user matches the hardcoded userId = 1 in our auth middleware.
  //    upsert = INSERT if not exists, UPDATE if exists (idempotent).
  // ---------------------------------------------------------------------------
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@scheduler.local" },
    update: {},
    create: {
      id: 1,
      name: "Admin User",
      email: "admin@scheduler.local",
    },
  });

  console.log(`✅  Admin user ready: "${adminUser.name}"  (id = ${adminUser.id})`);

  // ---------------------------------------------------------------------------
  // 2. SEED: Event Types
  //    The admin's schedulable meeting formats.
  //    Slug is used as the URL path: /book/<slug>
  // ---------------------------------------------------------------------------
  const eventTypes = [
    {
      title: "15 Min Chat",
      slug: "15-min-chat",
      description:
        "A quick introductory call to get to know each other.",
      duration: 15,
      color: "#6366f1",
      userId: 1,
    },
    {
      title: "30 Min Interview",
      slug: "30-min-interview",
      description:
        "A focused technical or behavioural interview session.",
      duration: 30,
      color: "#8b5cf6",
      userId: 1,
    },
    {
      title: "60 Min Deep Dive",
      slug: "60-min-deep-dive",
      description:
        "An in-depth consultation or pair programming session.",
      duration: 60,
      color: "#06b6d4",
      userId: 1,
    },
  ];

  console.log("\n📅  Seeding event types...");
  for (const et of eventTypes) {
    const created = await prisma.eventType.upsert({
      where: { slug: et.slug },
      update: {},
      create: et,
    });
    console.log(
      `   ✅  "${created.title}"  →  /book/${created.slug}  (${created.duration} min)`
    );
  }

  // ---------------------------------------------------------------------------
  // 3. SEED: Weekly Availability
  //    dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  //    startTime / endTime stored as "HH:MM" strings (24-hour, timezone-agnostic)
  // ---------------------------------------------------------------------------
  const weekSchedule = [
    { dayOfWeek: 0, isEnabled: false }, // Sunday  — off
    { dayOfWeek: 1, isEnabled: true  }, // Monday
    { dayOfWeek: 2, isEnabled: true  }, // Tuesday
    { dayOfWeek: 3, isEnabled: true  }, // Wednesday
    { dayOfWeek: 4, isEnabled: true  }, // Thursday
    { dayOfWeek: 5, isEnabled: true  }, // Friday
    { dayOfWeek: 6, isEnabled: false }, // Saturday — off
  ];

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  console.log("\n🕘  Seeding availability schedule...");
  for (const day of weekSchedule) {
    await prisma.availability.upsert({
      where: {
        userId_dayOfWeek: { userId: 1, dayOfWeek: day.dayOfWeek },
      },
      update: {},
      create: {
        userId: 1,
        dayOfWeek: day.dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        isEnabled: day.isEnabled,
      },
    });
    const dayName = DAY_NAMES[day.dayOfWeek].padEnd(12);
    const hours = day.isEnabled ? "09:00 – 17:00" : "Off";
    console.log(`   ${day.isEnabled ? "✅" : "⛔"}  ${dayName}  ${hours}`);
  }

  console.log("\n🎉  Database seeded successfully!\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("\n❌  Seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
