import { z } from "zod";

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatusDTO = (typeof ORDER_STATUSES)[number];

// Checkout takes an email, the caller's cart token, and contact/shipping
// details — nothing about prices. The API reads the cart from that token and
// recomputes every total. A signed-in caller identifies their cart via the
// Authorization header instead (see apps/api/src/orders) — cartToken is only
// required for a guest.
//
// Name/phone/address are required even for a guest checkout: with online
// payment disabled (see PAYMENTS_ENABLED in apps/api/src/orders), an order is
// only actionable if a human can actually reach the buyer to collect payment
// and ship it.
export const checkoutSchema = z.object({
  email: z.email(),
  cartToken: z.string().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(30),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(100),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * `url` is a Stripe Checkout URL to redirect to when online payment is
 * enabled, or null when it isn't — the order is placed directly and the
 * caller should go straight to the confirmation page for `orderNumber`.
 */
export type CheckoutResultDTO = {
  url: string | null;
  orderNumber: string;
};

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
  carrier: string | null;
  trackingNumber: string | null;
  items: OrderItemDTO[];
};

/** Row shape for a signed-in customer's own order history — no address or items. */
export type MyOrderListItemDTO = {
  orderNumber: string;
  status: OrderStatusDTO;
  totalCents: number;
  itemCount: number;
  createdAt: string;
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
  shippingPhone: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostal: string | null;
  shippingCountry: string | null;
  carrier: string | null;
  trackingNumber: string | null;
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
  // Only meaningful alongside status: SHIPPED — set together so "mark shipped"
  // is one action, not two.
  carrier: z.string().trim().min(1).max(100).nullish(),
  trackingNumber: z.string().trim().min(1).max(100).nullish(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
