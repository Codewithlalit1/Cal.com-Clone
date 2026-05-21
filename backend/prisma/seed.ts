// =============================================================================
// prisma/seed.ts — Database Seeder
//
// PURPOSE:
//   Populates the database with an initial data set so the frontend has
//   something to render immediately. Run this after every migration reset.
//
// WHAT GETS SEEDED:
//   1. Admin User (id = 1)   — the hardcoded "logged in" user
//   2. Event Types           — 3 sample meeting formats
//   3. Availability          — Mon–Fri 9 AM–5 PM, weekends disabled
//
// HOW TO RUN:
//   npx prisma db seed        (uses the "prisma.seed" script in package.json)
//   -- OR --
//   npx tsx prisma/seed.ts    (run directly)
//
// NOTE: We use `upsert` instead of `create` so the script is idempotent —
//       you can run it multiple times without creating duplicate rows.
// =============================================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma v7 requires an explicit database adapter instead of reading the URL
// from schema.prisma. The adapter is instantiated with our DATABASE_URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Starting database seed...\n");

  // ---------------------------------------------------------------------------
  // 1. SEED: Admin User
  //    We upsert by email so re-running the seed never creates a duplicate.
  //    The id is explicitly set to 1 so our hardcoded userId = 1 in middleware
  //    always refers to this user.
  // ---------------------------------------------------------------------------
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@scheduler.local" },
    update: {}, // no updates on re-seed — keep existing data intact
    create: {
      id: 1,
      name: "Admin User",
      email: "admin@scheduler.local",
    },
  });

  console.log(`✅  Admin user ready: "${adminUser.name}"  (id = ${adminUser.id})`);

  // ---------------------------------------------------------------------------
  // 2. SEED: Event Types
  //    Three sample meeting formats the admin "offers."
  //    Each has a unique slug that will be used in the public booking URL,
  //    e.g.  /book/30-min-interview
  // ---------------------------------------------------------------------------
  const eventTypesToSeed = [
    {
      title: "15 Min Chat",
      slug: "15-min-chat",
      description:
        "A quick introductory call. Great for getting to know each other before committing to a longer session.",
      duration: 15,        // minutes
      color: "#6366f1",    // indigo
    },
    {
      title: "30 Min Interview",
      slug: "30-min-interview",
      description:
        "A focused interview session covering technical skills or role-specific topics.",
      duration: 30,
      color: "#8b5cf6",    // violet
    },
    {
      title: "60 Min Deep Dive",
      slug: "60-min-deep-dive",
      description:
        "An in-depth discussion for complex topics, consulting, or pair programming sessions.",
      duration: 60,
      color: "#06b6d4",    // cyan
    },
  ];

  console.log("\n📅  Seeding event types...");
  for (const eventType of eventTypesToSeed) {
    const created = await prisma.eventType.upsert({
      where: { slug: eventType.slug },
      update: {}, // if it already exists, leave it as-is
      create: {
        ...eventType,
        userId: adminUser.id,
      },
    });
    console.log(
      `   ✅  "${created.title}"  →  /book/${created.slug}  (${created.duration} min)`
    );
  }

  // ---------------------------------------------------------------------------
  // 3. SEED: Availability Schedule
  //    Represents the admin's recurring weekly availability.
  //
  //    dayOfWeek convention:
  //      0 = Sunday | 1 = Monday | 2 = Tuesday | 3 = Wednesday
  //      4 = Thursday | 5 = Friday | 6 = Saturday
  //
  //    Times are stored as "HH:MM" strings (24-hour format) so they are
  //    timezone-agnostic. The frontend is responsible for timezone conversion.
  // ---------------------------------------------------------------------------
  const weekSchedule = [
    { dayOfWeek: 0, label: "Sunday",    isEnabled: false }, // Weekend — off
    { dayOfWeek: 1, label: "Monday",    isEnabled: true  }, // ╮
    { dayOfWeek: 2, label: "Tuesday",   isEnabled: true  }, // │
    { dayOfWeek: 3, label: "Wednesday", isEnabled: true  }, // │ Workweek 9–5
    { dayOfWeek: 4, label: "Thursday",  isEnabled: true  }, // │
    { dayOfWeek: 5, label: "Friday",    isEnabled: true  }, // ╯
    { dayOfWeek: 6, label: "Saturday",  isEnabled: false }, // Weekend — off
  ];

  console.log("\n🕘  Seeding availability schedule...");
  for (const day of weekSchedule) {
    await prisma.availability.upsert({
      where: {
        userId_dayOfWeek: { userId: adminUser.id, dayOfWeek: day.dayOfWeek },
      },
      update: {},
      create: {
        userId: adminUser.id,
        dayOfWeek: day.dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        isEnabled: day.isEnabled,
      },
    });
    const status = day.isEnabled ? "09:00 – 17:00" : "Off";
    console.log(`   ${day.isEnabled ? "✅" : "⛔"}  ${day.label.padEnd(12)}  ${status}`);
  }

  console.log("\n🎉  Database seeded successfully!\n");
}

// ---------------------------------------------------------------------------
// Execute and disconnect — always disconnect the client to avoid hanging
// ---------------------------------------------------------------------------
main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("\n❌  Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
