"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  apiLogin,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
} from "@/lib/api";
import { setToken, clearToken } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const res = await apiLogin(email, password);
  if (!res.ok) return { ok: false, error: res.error };

  // Only admins may use this app. A valid non-admin login is still refused here.
  if (res.data.user.role !== "ADMIN") {
    return { ok: false, error: "This account is not an administrator." };
  }
  await setToken(res.data.token);
  redirect("/products");
}

export async function logoutAction(): Promise<void> {
  await clearToken();
  redirect("/login");
}

/** Build the create/update payload from the product form. */
function readProductForm(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k);
    return v == null || v === "" ? undefined : String(v);
  };
  return {
    slug: str("slug"),
    title: str("title"),
    description: str("description"),
    type: str("type"),
    priceDollars: str("priceDollars") ? Number(str("priceDollars")) : undefined,
    stock: str("stock") ? Number(str("stock")) : undefined,
    imageUrl: str("imageUrl") ?? null,
    categorySlug: str("categorySlug") ?? null,
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
  };
}

export async function createProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const res = await apiCreateProduct(readProductForm(formData));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/products");
  redirect("/products");
}

export async function updateProductAction(
  slug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const res = await apiUpdateProduct(slug, readProductForm(formData));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProductAction(slug: string): Promise<void> {
  await apiDeleteProduct(slug);
  revalidatePath("/products");
}
