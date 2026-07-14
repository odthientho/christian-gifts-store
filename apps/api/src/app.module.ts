import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { ProductsModule } from "./products/products.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CartModule } from "./cart/cart.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { ImagesModule } from "./images/images.module.js";
import { ContentModule } from "./content/content.module.js";
import { ProxyAwareThrottlerGuard } from "./common/proxy-aware-throttler.guard.js";

@Module({
  imports: [
    // Global rate limiting — re-homes the storefront's per-IP throttle to the
    // API boundary. 120 requests per minute per IP by default.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    ImagesModule,
    ContentModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ProxyAwareThrottlerGuard }],
})
export class AppModule {}
