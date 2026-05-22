import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Global singleton pattern — prevents creating multiple Prisma connections
// during hot-reloads in development (nodemon restarts the module but the
// global object persists in the Node process).
let prismaInstance;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma =
  globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient());

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
