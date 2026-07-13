import { Module } from "@nestjs/common";

import { OrdersService } from "./orders.service.js";
import { OrdersController } from "./orders.controller.js";
import { StripeService } from "./stripe.service.js";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, StripeService],
  exports: [OrdersService],
})
export class OrdersModule {}
