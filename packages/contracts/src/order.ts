import { z } from "zod";

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatusDTO = (typeof ORDER_STATUSES)[number];

// Checkout takes an email and the caller's cart token — nothing about prices.
// The API reads the cart from that token and recomputes every total.
export const checkoutSchema = z.object({
  email: z.email(),
  cartToken: z.string().min(1).max(64),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type OrderItemDTO = {
  id: string;
  titleSnapshot: string;
  unitPriceCents: number;
  quantity: number;
};

export type OrderDTO = {
  orderNumber: string;
  status: OrderStatusDTO;
  totalCents: number;
  items: OrderItemDTO[];
};
