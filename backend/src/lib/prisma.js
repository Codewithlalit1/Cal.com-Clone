// src/lib/prisma.js
// =============================================================================
// Prisma Client — Neon Serverless Driver
//
// ESM IMPORT HOISTING FIX:
//   In ES modules, all `import` statements are hoisted and resolved before any
//   code runs. This means `import "dotenv/config"` executes at the same time
//   as other imports, so process.env.DATABASE_URL isn't ready immediately.
//   Fix → lazy singleton: the client is created on the first DB call.
// =============================================================================

import { PrismaNeon }       from "@prisma/adapter-neon";
import { PrismaClient }     from "@prisma/client";
import { neonConfig }       from "@neondatabase/serverless";
import ws                   from "ws";

// ── WebSocket polyfill ────────────────────────────────────────────────────────
// @neondatabase/serverless uses WebSockets to bypass strict firewalls that
// block standard database ports like 5432.
neonConfig.webSocketConstructor = ws;

let _prisma = null;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  // In Prisma v7, PrismaNeon is a factory that internally creates the Neon Pool.
  // We just pass the config object containing connectionString.
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Proxy forwards every property access to the lazily-created Prisma client.
export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!_prisma) _prisma = createPrismaClient();
      return _prisma[prop];
    },
  }
);
