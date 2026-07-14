import { Injectable } from "@nestjs/common";
import { prisma } from "@gin/db";
import type {
  ReportsDTO,
  SalesPeriodDTO,
  RevenuePointDTO,
  TopCustomerDTO,
  TopProductDTO,
  CategorySalesDTO,
  OrderStatusDTO,
} from "@gin/contracts";

import { LOW_STOCK_THRESHOLD } from "../products/products.service.js";

// Orders in these statuses represent money actually collected. Mirrors
// apps/api/src/orders/orders.service.ts — kept in sync by hand since a
// shared constant would need its own module just for this one array.
const REVENUE_STATUSES: OrderStatusDTO[] = ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"];

const PERIOD_CONFIG: Record<
  SalesPeriodDTO,
  { lookbackDays: number; bucket: (d: Date) => string }
> = {
  day: { lookbackDays: 30, bucket: (d) => d.toISOString().slice(0, 10) },
  month: { lookbackDays: 365, bucket: (d) => d.toISOString().slice(0, 7) },
  year: { lookbackDays: 365 * 5, bucket: (d) => d.toISOString().slice(0, 4) },
};

@Injectable()
export class ReportsService {
  /**
   * Every figure here comes from real order/product rows, aggregated in JS
   * after one bounded fetch per source table — simpler and safer than raw
   * SQL date-bucketing, and fine at this scale (a store's order volume is
   * nowhere near where that would matter).
   */
  async getReports(period: SalesPeriodDTO): Promise<ReportsDTO> {
    const config = PERIOD_CONFIG[period];
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - config.lookbackDays);

    const [revenueOrders, lineItems, lowStockProducts] = await Promise.all([
      prisma.order.findMany({
        where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since } },
        select: { totalCents: true, createdAt: true, email: true, shippingName: true },
      }),
      prisma.orderItem.findMany({
        where: {
          order: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since } },
        },
        select: {
          unitPriceCents: true,
          quantity: true,
          product: {
            select: { slug: true, title: true, category: { select: { name: true } } },
          },
        },
      }),
      prisma.product.findMany({
        where: { active: true, stock: { lte: LOW_STOCK_THRESHOLD } },
        orderBy: { stock: "asc" },
        take: 50,
        select: { slug: true, title: true, stock: true },
      }),
    ]);

    // --- Revenue over time -------------------------------------------------
    const buckets = new Map<string, { totalCents: number; orderCount: number }>();
    for (const order of revenueOrders) {
      const key = config.bucket(order.createdAt);
      const entry = buckets.get(key) ?? { totalCents: 0, orderCount: 0 };
      entry.totalCents += order.totalCents;
      entry.orderCount += 1;
      buckets.set(key, entry);
    }
    const revenue: RevenuePointDTO[] = [...buckets.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([label, v]) => ({ label, totalCents: v.totalCents, orderCount: v.orderCount }));

    // --- Top customers -------------------------------------------------------
    // Grouped by email rather than userId: a guest checkout has no account,
    // but still has an email, and that's who an admin would actually contact.
    const customers = new Map<
      string,
      { name: string | null; totalCents: number; orderCount: number }
    >();
    for (const order of revenueOrders) {
      const entry = customers.get(order.email) ?? {
        name: order.shippingName,
        totalCents: 0,
        orderCount: 0,
      };
      entry.totalCents += order.totalCents;
      entry.orderCount += 1;
      if (order.shippingName) entry.name = order.shippingName;
      customers.set(order.email, entry);
    }
    const topCustomers: TopCustomerDTO[] = [...customers.entries()]
      .map(([email, v]) => ({
        email,
        name: v.name,
        totalCents: v.totalCents,
        orderCount: v.orderCount,
      }))
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 10);

    // --- Top products ("high demand") and category sales --------------------
    const products = new Map<
      string,
      { title: string; quantitySold: number; totalCents: number }
    >();
    const categories = new Map<string, { quantitySold: number; totalCents: number }>();
    for (const item of lineItems) {
      // A product can be deleted after it was ordered; the line item survives
      // (titleSnapshot), but there's nothing left to attribute demand to here.
      if (!item.product) continue;
      const lineTotal = item.unitPriceCents * item.quantity;

      const p = products.get(item.product.slug) ?? {
        title: item.product.title,
        quantitySold: 0,
        totalCents: 0,
      };
      p.quantitySold += item.quantity;
      p.totalCents += lineTotal;
      products.set(item.product.slug, p);

      const catName = item.product.category?.name ?? "Uncategorized";
      const c = categories.get(catName) ?? { quantitySold: 0, totalCents: 0 };
      c.quantitySold += item.quantity;
      c.totalCents += lineTotal;
      categories.set(catName, c);
    }
    const topProducts: TopProductDTO[] = [...products.entries()]
      .map(([slug, v]) => ({
        slug,
        title: v.title,
        quantitySold: v.quantitySold,
        totalCents: v.totalCents,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);
    const categorySales: CategorySalesDTO[] = [...categories.entries()]
      .map(([name, v]) => ({ name, quantitySold: v.quantitySold, totalCents: v.totalCents }))
      .sort((a, b) => b.totalCents - a.totalCents);

    return { period, revenue, topCustomers, topProducts, categorySales, lowStockProducts };
  }
}
