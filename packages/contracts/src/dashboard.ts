import type { AdminOrderListItemDTO } from "./order.js";
import type { OrderStatusDTO } from "./order.js";

// Every figure here is derived from real order/product rows — there is no
// visit or session tracking in this app, so metrics like "visitors" or
// "conversion rate" are deliberately not part of this DTO rather than faked.

export type RevenueByDayDTO = { date: string; totalCents: number };
export type CategoryRevenueDTO = { name: string; totalCents: number };
export type LowStockProductDTO = { slug: string; title: string; stock: number };
export type OrderStatusCountDTO = { status: OrderStatusDTO; count: number };

export type DashboardSummaryDTO = {
  // Sum of totalCents for orders in a revenue-recognized status (PAID and
  // everything downstream of it) — all time.
  totalSalesCents: number;
  // Count of orders that reached a completed checkout (any revenue status, or
  // REFUNDED) — excludes abandoned PENDING sessions and CANCELLED ones.
  totalOrders: number;
  // totalSalesCents / count of revenue-recognized orders. 0 when there are none.
  avgOrderValueCents: number;
  // % change vs. the prior 7-day window, for revenue-recognized orders placed
  // in the last 7 days. Null when the prior window has zero orders — a
  // percentage against zero is undefined, not "∞%" or "0%".
  salesChangePct: number | null;
  ordersChangePct: number | null;
  // Distinct customer emails (revenue-recognized orders, all time): exactly
  // one order = new, more than one = returning.
  newCustomerCount: number;
  returningCustomerCount: number;
  ordersNeedingReview: number;
  // PENDING orders — placed, but payment hasn't been collected yet. With
  // online payment disabled this is the normal state right after checkout,
  // not an error; an admin needs to see it to know who to contact.
  pendingPaymentCount: number;
  // Every order status, in lifecycle order, zero-filled — a funnel view, not
  // just whatever happens to be in the 5 most recent orders.
  statusBreakdown: OrderStatusCountDTO[];
  // Last 14 days, oldest first, zero-filled for days with no revenue.
  revenueByDay: RevenueByDayDTO[];
  // Top 5 categories by revenue, from revenue-recognized order line items.
  topCategories: CategoryRevenueDTO[];
  // Active products at or below the low-stock threshold, lowest first.
  lowStockProducts: LowStockProductDTO[];
  recentOrders: AdminOrderListItemDTO[];
};
