// dotenv first: the @gin/db Prisma singleton reads DATABASE_URL at import time,
// so the env must be populated before anything in the module graph loads it.
import "dotenv/config";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import helmet from "helmet";

import { AppModule } from "./app.module.js";

async function bootstrap() {
  // rawBody keeps the unparsed request bytes available (req.rawBody) so the
  // Stripe webhook can verify the signature against exactly what Stripe sent.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Security headers at the API boundary.
  app.use(helmet());

  // Only the storefront and admin origins may call the API from a browser.
  const origins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  // Every route lives under /api.
  app.setGlobalPrefix("api");

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}

void bootstrap();
