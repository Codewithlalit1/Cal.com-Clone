import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function setup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Connecting to Neon via WebSockets to execute schema...");

    // Clean slate: Drop existing tables and types safely
    await pool.query(`
      DROP TABLE IF EXISTS "bookings" CASCADE;
      DROP TABLE IF EXISTS "availability" CASCADE;
      DROP TABLE IF EXISTS "event_types" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
      DROP TYPE IF EXISTS "BookingStatus" CASCADE;
    `);
    console.log("Cleaned up old schema.");

    // Create the schema
    await pool.query(`
      CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');

      CREATE TABLE "users" (
          "id" SERIAL NOT NULL,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "event_types" (
          "id" SERIAL NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "duration" INTEGER NOT NULL,
          "slug" TEXT NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "color" TEXT NOT NULL DEFAULT '#6366f1',
          "userId" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "availability" (
          "id" SERIAL NOT NULL,
          "dayOfWeek" INTEGER NOT NULL,
          "startTime" TEXT NOT NULL,
          "endTime" TEXT NOT NULL,
          "isEnabled" BOOLEAN NOT NULL DEFAULT true,
          "userId" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "bookings" (
          "id" SERIAL NOT NULL,
          "bookerName" TEXT NOT NULL,
          "bookerEmail" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL,
          "startTime" TIMESTAMP(3) NOT NULL,
          "endTime" TIMESTAMP(3) NOT NULL,
          "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
          "notes" TEXT,
          "eventTypeId" INTEGER NOT NULL,
          "userId" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
      );

      CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
      CREATE UNIQUE INDEX "event_types_slug_key" ON "event_types"("slug");
      CREATE UNIQUE INDEX "availability_userId_dayOfWeek_key" ON "availability"("userId", "dayOfWeek");

      ALTER TABLE "event_types" ADD CONSTRAINT "event_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "availability" ADD CONSTRAINT "availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "bookings" ADD CONSTRAINT "bookings_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    
    console.log("Schema successfully created!");
  } catch (err) {
    console.error("Error creating schema:", err);
  } finally {
    await pool.end();
  }
}

setup();
