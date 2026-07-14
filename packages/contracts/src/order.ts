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
// The API reads the cart from that token and recomputes every total. A
// signed-in caller identifies their cart via the Authorization header instead
// (see apps/api/src/orders) — cartToken is only required for a guest.
export const checkoutSchema = z.object({
  email: z.email(),
  cartToken: z.string().min(1).max(64).optional(),
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

// The admin view of an order — everything a customer's own view deliberately
// omits (their email address isn't hidden from them, but a stranger's is,
// and there is no reason a customer needs to see the raw Stripe ids).
export type AdminOrderDTO = {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatusDTO;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  needsReview: boolean;
  shippingName: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostal: string | null;
  shippingCountry: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
};

/** Row shape for the admin order list — no line items, keeps the list light. */
export type AdminOrderListItemDTO = Omit<AdminOrderDTO, "items">;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
