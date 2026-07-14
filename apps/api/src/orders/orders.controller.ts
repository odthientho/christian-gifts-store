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
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import type Stripe from "stripe";
import { Throttle } from "@nestjs/throttler";
import {
  checkoutSchema,
  updateOrderStatusSchema,
  type CheckoutInput,
  type UpdateOrderStatusInput,
  type JwtClaims,
} from "@gin/contracts";

import { OrdersService } from "./orders.service.js";
import { StripeService } from "./stripe.service.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { OptionalJwtGuard, JwtAuthGuard, RolesGuard, Roles, CurrentUser } from "../auth/guards.js";

// Optional auth on the whole controller: checkout and order lookup both work
// for a guest, and both prefer the caller's identity when signed in. The
// webhook route ignores this entirely — Stripe never sends a bearer token.
@Controller()
@UseGuards(OptionalJwtGuard)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly stripe: StripeService,
  ) {}

  // Each hit creates a real order row (and a real Stripe Checkout Session,
  // when payments are enabled) — a tighter limit than the global default,
  // matching the original design.
  @Post("checkout")
  @Throttle({ default: { ttl: 600_000, limit: 20 } })
  async checkout(
    @CurrentUser() user: JwtClaims | undefined,
    @Body(new ZodValidationPipe(checkoutSchema)) body: CheckoutInput,
    @Headers("origin") origin?: string,
  ) {
    const siteUrl =
      process.env.STOREFRONT_URL ?? origin ?? "http://localhost:3000";
    return this.orders.createCheckout(body, user?.sub, siteUrl);
  }

  // Lets the storefront show the right checkout copy (and skip expecting a
  // Stripe redirect) without guessing from an error message.
  @Get("config")
  getConfig() {
    return { paymentsEnabled: this.orders.paymentsEnabled() };
  }

  @Get("orders/:orderNumber")
  async getOrder(
    @CurrentUser() user: JwtClaims | undefined,
    @Param("orderNumber") orderNumber: string,
    @Query("cartToken") cartToken?: string,
  ) {
    // Returns null (not 404) for both missing and unauthorized, so a guessed
    // order number cannot be distinguished from a real one.
    return this.orders.getOwnedOrder(orderNumber, user?.sub, cartToken);
  }

  // Stacks JwtAuthGuard on top of the controller's OptionalJwtGuard — unlike
  // every other route here, a guest has no account to look an order history
  // up under, so this one actually requires sign-in.
  @Get("orders")
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: JwtClaims) {
    return this.orders.listMyOrders(user.sub);
  }

  // --- Admin -------------------------------------------------------------

  @Get("admin/orders")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listAll() {
    return this.orders.listAllOrders();
  }

  // Registered ahead of the `:orderNumber` route below — Nest matches routes
  // in declaration order, and `:orderNumber` would otherwise swallow this
  // literal path.
  @Get("admin/orders/pending-count")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async pendingPaymentCount() {
    return { count: await this.orders.countPendingPayment() };
  }

  @Get("admin/dashboard")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  getDashboard() {
    return this.orders.getDashboardSummary();
  }

  @Get("admin/orders/:orderNumber")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  getForAdmin(@Param("orderNumber") orderNumber: string) {
    return this.orders.getOrderForAdmin(orderNumber);
  }

  @Post("admin/orders/:orderNumber/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  updateStatus(
    @Param("orderNumber") orderNumber: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) body: UpdateOrderStatusInput,
  ) {
    return this.orders.updateOrderStatus(
      orderNumber,
      body.status,
      body.carrier,
      body.trackingNumber,
    );
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

    switch (event.type) {
      case "checkout.session.completed":
        await this.orders.fulfillCheckoutSession(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "charge.refunded":
        await this.orders.markRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        // Unhandled events are fine; acknowledge so Stripe stops retrying.
        break;
    }
    return { received: true };
  }
}
