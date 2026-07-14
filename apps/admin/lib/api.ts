import { headers as nextHeaders } from "next/headers";

import { getToken } from "@/lib/session";
import type {
  ProductDTO,
  CategoryDTO,
  AuthUserDTO,
  AuthResponse,
  AdminOrderDTO,
  AdminOrderListItemDTO,
  HeroSlideDTO,
  PromoTileDTO,
} from "@gin/contracts";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

/**
 * Every request this app makes to the API arrives from this server's single
 * IP, so the API's own per-IP rate limiting would otherwise see one shared
 * identity for every admin using this app. Forward the real caller's IP so
 * the API can throttle per person — matters most for login attempts.
 */
async function visitorIp(): Promise<string | undefined> {
  const h = await nextHeaders();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return h.get("x-real-ip")?.trim();
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<Result<T>> {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (init.body) headers.set("content-type", "application/json");
  if (init.auth) {
    const token = await getToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }
  const ip = await visitorIp();
  if (ip) headers.set("x-forwarded-for", ip);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, error: "Could not reach the API" };
  }

  if (res.status === 204) return { ok: true, data: undefined as T };

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const error =
      body?.errors?.[0]?.message ?? body?.message ?? `Request failed (${res.status})`;
    return { ok: false, status: res.status, error };
  }
  return { ok: true, data: body as T };
}

// --- Auth ------------------------------------------------------------------

export function apiLogin(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiMe(): Promise<AuthUserDTO | null> {
  const r = await request<AuthUserDTO>("/auth/me", { auth: true });
  return r.ok ? r.data : null;
}

// --- Products (admin, authed) ----------------------------------------------

export async function apiAdminProducts(): Promise<ProductDTO[]> {
  const r = await request<ProductDTO[]>("/admin/products", { auth: true });
  return r.ok ? r.data : [];
}

export async function apiAdminProduct(slug: string): Promise<ProductDTO | null> {
  const r = await request<ProductDTO>(`/admin/products/${slug}`, { auth: true });
  return r.ok ? r.data : null;
}

export function apiCreateProduct(body: unknown) {
  return request<ProductDTO>("/admin/products", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function apiUpdateProduct(slug: string, body: unknown) {
  return request<ProductDTO>(`/admin/products/${slug}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function apiDeleteProduct(slug: string) {
  return request<void>(`/admin/products/${slug}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function apiCategories(): Promise<CategoryDTO[]> {
  const r = await request<CategoryDTO[]>("/categories");
  return r.ok ? r.data : [];
}

export function apiCreateCategory(body: unknown) {
  return request<CategoryDTO>("/admin/categories", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function apiUpdateCategory(slug: string, body: unknown) {
  return request<CategoryDTO>(`/admin/categories/${slug}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function apiDeleteCategory(slug: string) {
  return request<void>(`/admin/categories/${slug}`, {
    method: "DELETE",
    auth: true,
  });
}

// --- Orders (admin, authed) --------------------------------------------------

export async function apiAdminOrders(): Promise<AdminOrderListItemDTO[]> {
  const r = await request<AdminOrderListItemDTO[]>("/admin/orders", { auth: true });
  return r.ok ? r.data : [];
}

export async function apiAdminOrder(orderNumber: string): Promise<AdminOrderDTO | null> {
  const r = await request<AdminOrderDTO>(`/admin/orders/${orderNumber}`, { auth: true });
  return r.ok ? r.data : null;
}

export function apiUpdateOrderStatus(orderNumber: string, status: string) {
  return request<AdminOrderDTO>(`/admin/orders/${orderNumber}/status`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ status }),
  });
}

// --- Site content: hero slides (admin, authed) --------------------------------

export async function apiAdminHeroSlides(): Promise<HeroSlideDTO[]> {
  const r = await request<HeroSlideDTO[]>("/admin/hero-slides", { auth: true });
  return r.ok ? r.data : [];
}

export function apiCreateHeroSlide(body: unknown) {
  return request<HeroSlideDTO>("/admin/hero-slides", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function apiUpdateHeroSlide(id: string, body: unknown) {
  return request<HeroSlideDTO>(`/admin/hero-slides/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function apiDeleteHeroSlide(id: string) {
  return request<void>(`/admin/hero-slides/${id}`, { method: "DELETE", auth: true });
}

// --- Site content: promo tiles (admin, authed) ---------------------------------

export async function apiAdminPromoTiles(): Promise<PromoTileDTO[]> {
  const r = await request<PromoTileDTO[]>("/admin/promo-tiles", { auth: true });
  return r.ok ? r.data : [];
}

export function apiCreatePromoTile(body: unknown) {
  return request<PromoTileDTO>("/admin/promo-tiles", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function apiUpdatePromoTile(id: string, body: unknown) {
  return request<PromoTileDTO>(`/admin/promo-tiles/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function apiDeletePromoTile(id: string) {
  return request<void>(`/admin/promo-tiles/${id}`, { method: "DELETE", auth: true });
}

// --- Images (admin, authed) ---------------------------------------------------
// Multipart, so this bypasses `request()`: that helper always sets
// content-type: application/json, which would corrupt a file upload's actual
// multipart boundary encoding.

export async function apiUploadImage(
  file: File,
): Promise<Result<{ id: string; url: string }>> {
  const token = await getToken();
  if (!token) return { ok: false, status: 401, error: "Not signed in." };

  const ip = await visitorIp();
  const headers = new Headers({ authorization: `Bearer ${token}` });
  if (ip) headers.set("x-forwarded-for", ip);

  const body = new FormData();
  body.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/images`, { method: "POST", headers, body });
  } catch {
    return { ok: false, status: 0, error: "Could not reach the API" };
  }

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: parsed?.message ?? `Upload failed (${res.status})`,
    };
  }
  return { ok: true, data: parsed };
}
