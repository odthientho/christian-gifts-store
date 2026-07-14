import { z } from "zod";

import type { LowStockProductDTO } from "./dashboard.js";

export const SALES_PERIODS = ["day", "month", "year"] as const;
export type SalesPeriodDTO = (typeof SALES_PERIODS)[number];

export const reportsQuerySchema = z.object({
  period: z.enum(SALES_PERIODS).default("month"),
});
export type ReportsQuery = z.infer<typeof reportsQuerySchema>;

/** One bucket of a revenue-over-time series — a day, month, or year. */
export type RevenuePointDTO = {
  // "2026-07-14" for day, "2026-07" for month, "2026" for year.
  label: string;
  totalCents: number;
  orderCount: number;
};

/** Lifetime spend for one customer, from revenue-recognized orders. */
export type TopCustomerDTO = {
  email: string;
  name: string | null;
  totalCents: number;
  orderCount: number;
};

/** Units and revenue for one product, from revenue-recognized order items. */
export type TopProductDTO = {
  slug: string;
  title: string;
  quantitySold: number;
  totalCents: number;
};

export type CategorySalesDTO = {
  name: string;
  totalCents: number;
  quantitySold: number;
};

export type ReportsDTO = {
  period: SalesPeriodDTO;
  revenue: RevenuePointDTO[];
  topCustomers: TopCustomerDTO[];
  topProducts: TopProductDTO[];
  categorySales: CategorySalesDTO[];
  lowStockProducts: LowStockProductDTO[];
};
