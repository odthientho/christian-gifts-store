import type {
  ProductDTO,
  CategoryDTO,
  CartViewDTO,
  OrderDTO,
  AuthResponse,
  AuthUserDTO,
  HeroSlideDTO,
  PromoTileDTO,
  MyOrderListItemDTO,
  CheckoutInput,
  CheckoutResultDTO,
  PublicConfigDTO,
} from "@gin/contracts";

// Server-side client for the GIN API. Runs in Server Components / route handlers
// only — the browser never calls the API directly, so the base URL stays a
// server env var and there is no CORS exposure for reads.

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

type FetchOpts = { revalidate?: number };

async function apiGet<T>(
  path: string,
  opts: FetchOpts & { sessionToken?: string } = {},
): Promise<T | null> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (opts.sessionToken) headers.authorization = `Bearer ${opts.sessionToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    // Product data changes rarely; revalidate on a short window by default.
    // A per-caller request (session token present) must never be cached and
    // served to a different caller, so it forces revalidate: 0.
    next: { revalidate: opts.sessionToken ? 0 : (opts.revalidate ?? 30) },
    headers,
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

// --- Site content ------------------------------------------------------------
// Admin-managed hero slides and promo tiles. Empty results are normal — the
// callers fall back to hardcoded defaults when nothing has been configured.

export async function apiGetHeroSlides(): Promise<HeroSlideDTO[]> {
  return (await apiGet<HeroSlideDTO[]>("/hero-slides")) ?? [];
}

export async function apiGetPromoTiles(): Promise<PromoTileDTO[]> {
  return (await apiGet<PromoTileDTO[]>("/promo-tiles")) ?? [];
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
  sessionToken?: string,
): Promise<ApiSendResult<T>> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  if (visitorIp) headers["x-forwarded-for"] = visitorIp;
  if (sessionToken) headers.authorization = `Bearer ${sessionToken}`;

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

// A cart request carries a session token (signed in — the API resolves the
// cart by userId and this wins) and/or a guest cart token (the API falls back
// to it only when there is no valid session). Passing both is normal right
// after sign-in, in the brief window before the storefront stops sending the
// now-merged guest token.

export async function apiGetCart(
  sessionToken: string | undefined,
  cartToken: string | undefined,
): Promise<CartViewDTO | null> {
  if (!sessionToken && !cartToken) return null;
  return apiGet<CartViewDTO>(`/cart${qs({ token: cartToken })}`, {
    revalidate: 0,
    sessionToken,
  });
}

export function apiAddToCart(
  sessionToken: string | undefined,
  cartToken: string | undefined,
  productId: string,
  quantity: number,
) {
  return apiSend<CartViewDTO>(
    "/cart/items",
    "POST",
    { token: cartToken, productId, quantity },
    undefined,
    sessionToken,
  );
}

export function apiUpdateCartItem(
  sessionToken: string | undefined,
  cartToken: string | undefined,
  productId: string,
  quantity: number,
) {
  return apiSend<CartViewDTO>(
    "/cart/items",
    "PATCH",
    { token: cartToken, productId, quantity },
    undefined,
    sessionToken,
  );
}

// --- Checkout & orders -----------------------------------------------------

export function apiCheckout(
  input: Omit<CheckoutInput, "cartToken">,
  cartToken: string | undefined,
  visitorIp?: string,
  sessionToken?: string,
) {
  return apiSend<CheckoutResultDTO>(
    "/checkout",
    "POST",
    { ...input, cartToken },
    visitorIp,
    sessionToken,
  );
}

/** Public runtime config — whether checkout collects real payment right now. */
export async function apiGetConfig(): Promise<PublicConfigDTO> {
  return (await apiGet<PublicConfigDTO>("/config")) ?? { paymentsEnabled: false };
}

/** Returns the order only if the caller (by session or cart token) owns it. */
export async function apiGetOrder(
  orderNumber: string,
  sessionToken: string | undefined,
  cartToken: string | undefined,
): Promise<OrderDTO | null> {
  return apiGet<OrderDTO>(
    `/orders/${encodeURIComponent(orderNumber)}${qs({ cartToken })}`,
    { revalidate: 0, sessionToken },
  );
}

/** A signed-in customer's own order history. Requires a session token. */
export async function apiGetMyOrders(
  sessionToken: string,
): Promise<MyOrderListItemDTO[]> {
  return (
    (await apiGet<MyOrderListItemDTO[]>("/orders", { revalidate: 0, sessionToken })) ?? []
  );
}

// --- Auth ------------------------------------------------------------------

export function apiLogin(
  email: string,
  password: string,
  visitorIp?: string,
  cartToken?: string,
) {
  return apiSend<AuthResponse>(
    "/auth/login",
    "POST",
    { email, password, cartToken },
    visitorIp,
  );
}

export function apiRegister(
  name: string,
  email: string,
  password: string,
  visitorIp?: string,
  cartToken?: string,
) {
  return apiSend<AuthResponse>(
    "/auth/register",
    "POST",
    { name, email, password, cartToken },
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
