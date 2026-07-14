import type {
  ProductDTO,
  CategoryDTO,
  CartViewDTO,
  OrderDTO,
  AuthResponse,
  AuthUserDTO,
} from "@gin/contracts";

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

// --- Cart ------------------------------------------------------------------
// Cart calls are never cached and carry the caller's opaque cart token.

type ApiSendResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
  // Every request the storefront makes to the API arrives from the same
  // server-to-server connection, so the API's own per-IP rate limiting would
  // otherwise see one shared identity for every visitor and throttle the whole
  // site as a unit. Forwarding the real visitor IP lets the API's throttler key
  // on the actual caller — trusted here because CORS_ORIGINS restricts the API
  // to this app and the admin app, not arbitrary browsers.
  visitorIp?: string,
): Promise<ApiSendResult<T>> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  if (visitorIp) headers["x-forwarded-for"] = visitorIp;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Could not reach the store service." };
  }
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const error =
      parsed?.errors?.[0]?.message ?? parsed?.message ?? "Request failed.";
    return { ok: false, error: Array.isArray(error) ? error[0] : error };
  }
  return { ok: true, data: parsed as T };
}

export async function apiGetCart(token: string | undefined): Promise<CartViewDTO | null> {
  if (!token) return null;
  return apiGet<CartViewDTO>(`/cart${qs({ token })}`, { revalidate: 0 });
}

export function apiAddToCart(
  token: string | undefined,
  productId: string,
  quantity: number,
) {
  return apiSend<CartViewDTO>("/cart/items", "POST", { token, productId, quantity });
}

export function apiUpdateCartItem(
  token: string,
  productId: string,
  quantity: number,
) {
  return apiSend<CartViewDTO>("/cart/items", "PATCH", { token, productId, quantity });
}

// --- Checkout & orders -----------------------------------------------------

export function apiCheckout(email: string, cartToken: string, visitorIp?: string) {
  return apiSend<{ url: string }>(
    "/checkout",
    "POST",
    { email, cartToken },
    visitorIp,
  );
}

/** Returns the order only if the cart token entitles the caller; else null. */
export async function apiGetOrder(
  orderNumber: string,
  cartToken: string | undefined,
): Promise<OrderDTO | null> {
  return apiGet<OrderDTO>(
    `/orders/${encodeURIComponent(orderNumber)}${qs({ cartToken })}`,
    { revalidate: 0 },
  );
}

// --- Auth ------------------------------------------------------------------

export function apiLogin(email: string, password: string, visitorIp?: string) {
  return apiSend<AuthResponse>(
    "/auth/login",
    "POST",
    { email, password },
    visitorIp,
  );
}

export function apiRegister(
  name: string,
  email: string,
  password: string,
  visitorIp?: string,
) {
  return apiSend<AuthResponse>(
    "/auth/register",
    "POST",
    { name, email, password },
    visitorIp,
  );
}

/** The user behind a session token, or null if the token is missing/invalid. */
export async function apiMe(token: string | undefined): Promise<AuthUserDTO | null> {
  if (!token) return null;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/me`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  return (await res.json()) as AuthUserDTO;
}
