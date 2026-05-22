import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Explicitly load the .env file
dotenv.config();

// Failsafe to help you catch missing env variables
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is missing or .env file cannot be found!");
}

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",

  datasource: {
    // Connection string used by the Prisma CLI for schema migrations.
    // Reads DATABASE_URL from backend/.env via dotenv above.
    url: process.env.DATABASE_URL,
  },
});