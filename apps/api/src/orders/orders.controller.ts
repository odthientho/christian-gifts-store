import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Headers,
  HttpCode,
  BadRequestException,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import type Stripe from "stripe";
import { checkoutSchema, type CheckoutInput } from "@gin/contracts";

import { OrdersService } from "./orders.service.js";
import { StripeService } from "./stripe.service.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";

@Controller()
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly stripe: StripeService,
  ) {}

  @Post("checkout")
  async checkout(
    @Body(new ZodValidationPipe(checkoutSchema)) body: CheckoutInput,
    @Headers("origin") origin?: string,
  ) {
    const siteUrl =
      process.env.STOREFRONT_URL ?? origin ?? "http://localhost:3000";
    return this.orders.createCheckout(body.email, body.cartToken, siteUrl);
  }

  @Get("orders/:orderNumber")
  async getOrder(
    @Param("orderNumber") orderNumber: string,
    @Query("cartToken") cartToken?: string,
  ) {
    // Returns null (not 404) for both missing and unauthorized, so a guessed
    // order number cannot be distinguished from a real one.
    return this.orders.getOwnedOrder(orderNumber, cartToken);
  }

  @Post("stripe/webhook")
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    const raw = req.rawBody;
    if (!raw || !signature) {
      throw new BadRequestException("Missing signature or body");
    }

    // Verify against the raw bytes before trusting anything in the payload.
    let event: Stripe.Event;
    try {
      event = this.stripe
        .client()
        .webhooks.constructEvent(raw, signature, this.stripe.webhookSecret());
    } catch (err) {
      const message = err instanceof Error ? err.message : "bad signature";
      throw new BadRequestException(`Webhook signature failed: ${message}`);
    }

    if (event.type === "checkout.session.completed") {
      await this.orders.fulfillCheckoutSession(
        event.data.object as Stripe.Checkout.Session,
      );
    }
    return { received: true };
  }
}
