import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

import { ProductsModule } from "./products/products.module.js";

@Module({
  imports: [
    // Global rate limiting — re-homes the storefront's per-IP throttle to the
    // API boundary. 120 requests per minute per IP by default.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ProductsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
