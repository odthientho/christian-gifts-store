import type { AdminOrderListItemDTO } from "./order.js";

// Every figure here is derived from real order/product rows — there is no
// visit or session tracking in this app, so metrics like "visitors" or
// "conversion rate" are deliberately not part of this DTO rather than faked.

export type RevenueByDayDTO = { date: string; totalCents: number };
export type CategoryRevenueDTO = { name: string; totalCents: number };
export type LowStockProductDTO = { slug: string; title: string; stock: number };

export type DashboardSummaryDTO = {
  // Sum of totalCents for PAID + FULFILLED orders (all time).
  totalSalesCents: number;
  // Count of orders that reached a completed checkout (PAID, FULFILLED, or
  // REFUNDED) — excludes abandoned PENDING sessions and CANCELLED ones.
  totalOrders: number;
  ordersNeedingReview: number;
  // Last 14 days, oldest first, zero-filled for days with no revenue.
  revenueByDay: RevenueByDayDTO[];
  // Top 5 categories by revenue, from PAID + FULFILLED order line items.
  topCategories: CategoryRevenueDTO[];
  // Active products at or below the low-stock threshold, lowest first.
  lowStockProducts: LowStockProductDTO[];
  recentOrders: AdminOrderListItemDTO[];
};
