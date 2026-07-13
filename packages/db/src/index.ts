import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// The single Prisma client for the whole monorepo. Every service imports the
// client from here — no service constructs its own. Cached on globalThis so a
// dev-mode hot reload does not open a new connection pool each time.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export the generated types + enums so consumers import them from @gin/db
// rather than reaching into the generated folder.
export * from "./generated/prisma/client.js";
