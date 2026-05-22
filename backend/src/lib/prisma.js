// src/lib/prisma.js
// =============================================================================
// Prisma Client Singleton
//
// IMPORTANT — ESM IMPORT HOISTING:
//   In ES modules, all `import` statements are hoisted and resolved before any
//   code in the importing file runs. This means that even though index.js has
//   `import "dotenv/config"` at the top, the Prisma client (imported by the
//   controllers, which are imported by the routes, which are imported by
//   index.js) initialises BEFORE dotenv has populated process.env.
//
//   FIX → Use a lazy getter. The PrismaClient is NOT created at import time.
//   It is created on the first call to `getPrisma()`, which happens inside a
//   request handler — by which point dotenv has already run.
// =============================================================================

import { PrismaClient } from "@prisma/client";
import { PrismaPg }    from "@prisma/adapter-pg";

let _prisma = null;

/**
 * Returns the shared Prisma client, creating it on first call.
 * Call this inside route handlers / controllers, never at the module top-level.
 */
export function getPrisma() {
  if (_prisma) return _prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. " +
      "Make sure backend/.env exists and the server was started from the backend/ directory."
    );
  }

  const adapter = new PrismaPg({ connectionString });
  _prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return _prisma;
}

// Keep the named `prisma` export for backwards-compatibility with all existing
// controllers — they do `import { prisma } from "../lib/prisma.js"`.
// This Proxy forwards every property access to the lazy client, so the first
// real DB call triggers getPrisma() transparently.
export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      return getPrisma()[prop];
    },
    apply(_target, _thisArg, args) {
      return getPrisma()(...args);
    },
  }
);
