import { getToken } from "@/lib/session";
import type {
  ProductDTO,
  CategoryDTO,
  AuthUserDTO,
  AuthResponse,
} from "@gin/contracts";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

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
