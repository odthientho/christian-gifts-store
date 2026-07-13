import { Controller, Get, Post, Patch, Body, Query } from "@nestjs/common";
import {
  addToCartSchema,
  updateCartItemSchema,
  type AddToCartInput,
  type UpdateCartItemInput,
} from "@gin/contracts";

import { CartService } from "./cart.service.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";

@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  view(@Query("token") token?: string) {
    return this.cart.view(token);
  }

  @Post("items")
  add(@Body(new ZodValidationPipe(addToCartSchema)) body: AddToCartInput) {
    return this.cart.addItem(body.token, body.productId, body.quantity);
  }

  @Patch("items")
  update(
    @Body(new ZodValidationPipe(updateCartItemSchema)) body: UpdateCartItemInput,
  ) {
    return this.cart.updateItem(body.token, body.productId, body.quantity);
  }
}
