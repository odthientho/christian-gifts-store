import { Controller, Get, Post, Patch, Body, Query, UseGuards } from "@nestjs/common";
import {
  addToCartSchema,
  updateCartItemSchema,
  type AddToCartInput,
  type UpdateCartItemInput,
  type JwtClaims,
} from "@gin/contracts";

import { CartService } from "./cart.service.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { OptionalJwtGuard, CurrentUser } from "../auth/guards.js";

// Every route here accepts a signed-in caller or a guest — OptionalJwtGuard
// attaches the caller's identity if a valid bearer token is present, but never
// rejects an anonymous request. The service prefers userId over token whenever
// both could apply.
@Controller("cart")
@UseGuards(OptionalJwtGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  view(@CurrentUser() user: JwtClaims | undefined, @Query("token") token?: string) {
    return this.cart.view(user?.sub, token);
  }

  @Post("items")
  add(
    @CurrentUser() user: JwtClaims | undefined,
    @Body(new ZodValidationPipe(addToCartSchema)) body: AddToCartInput,
  ) {
    return this.cart.addItem(user?.sub, body.token, body.productId, body.quantity);
  }

  @Patch("items")
  update(
    @CurrentUser() user: JwtClaims | undefined,
    @Body(new ZodValidationPipe(updateCartItemSchema)) body: UpdateCartItemInput,
  ) {
    return this.cart.updateItem(user?.sub, body.token, body.productId, body.quantity);
  }
}
