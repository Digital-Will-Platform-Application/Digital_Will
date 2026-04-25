import prismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let prisma;
const { PrismaClient } = prismaPkg;

/**
 * Reuse a single PrismaClient in dev/watch mode to avoid exhausting DB connections.
 * (Node --watch reloads modules; this keeps a singleton on globalThis.)
 */
if (process.env.NODE_ENV !== 'production') {
  prisma =
    globalThis.__prisma ||
    new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }),
    });
  globalThis.__prisma = prisma;
} else {
  prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }),
  });
}

export default prisma;

