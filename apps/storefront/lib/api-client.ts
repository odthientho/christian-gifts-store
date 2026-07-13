import type { ProductDTO, CategoryDTO } from "@gin/contracts";

// Server-side client for the GIN API. Runs in Server Components / route handlers
// only — the browser never calls the API directly, so the base URL stays a
// server env var and there is no CORS exposure for reads.

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

type FetchOpts = { revalidate?: number };

async function apiGet<T>(
  path: string,
  opts: FetchOpts = {},
): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    // Product data changes rarely; revalidate on a short window by default.
    next: { revalidate: opts.revalidate ?? 30 },
    headers: { accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export type ApiProduct = ProductDTO;
export type ApiCategory = CategoryDTO;

export async function apiListProducts(params: {
  type?: "BOOK" | "GIFT";
  category?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
}): Promise<ApiProduct[]> {
  return (await apiGet<ApiProduct[]>(`/products${qs(params)}`)) ?? [];
}

export async function apiGetProduct(slug: string): Promise<ApiProduct | null> {
  return apiGet<ApiProduct>(`/products/${encodeURIComponent(slug)}`);
}

export async function apiListCategories(
  type?: "BOOK" | "GIFT",
): Promise<ApiCategory[]> {
  return (await apiGet<ApiCategory[]>(`/categories${qs({ type })}`)) ?? [];
}
