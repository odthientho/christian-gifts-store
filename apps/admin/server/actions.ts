"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  apiLogin,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiCreateCategory,
  apiUpdateCategory,
  apiDeleteCategory,
  apiUpdateOrderStatus,
  apiUploadImage,
  apiCreateHeroSlide,
  apiUpdateHeroSlide,
  apiDeleteHeroSlide,
  apiCreatePromoTile,
  apiUpdatePromoTile,
  apiDeletePromoTile,
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
  redirect("/dashboard");
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

export async function deleteProductAction(slug: string): Promise<ActionResult> {
  const res = await apiDeleteProduct(slug);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/products");
  return { ok: true };
}

// --- Orders ------------------------------------------------------------------

export async function updateOrderStatusAction(
  orderNumber: string,
  status: string,
  tracking?: { carrier?: string; trackingNumber?: string },
): Promise<ActionResult> {
  const res = await apiUpdateOrderStatus(orderNumber, status, tracking);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(`/orders/${orderNumber}`);
  revalidatePath("/orders");
  return { ok: true };
}

// --- Categories ----------------------------------------------------------------

function readCategoryForm(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? "") || undefined,
  };
}

export async function createCategoryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const res = await apiCreateCategory(readCategoryForm(formData));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategoryAction(
  slug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const res = await apiUpdateCategory(slug, readCategoryForm(formData));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/categories");
  redirect("/categories");
}

export async function deleteCategoryAction(slug: string): Promise<ActionResult> {
  const res = await apiDeleteCategory(slug);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/categories");
  return { ok: true };
}

// --- Site content: hero slides ---------------------------------------------------

function readHeroSlideForm(formData: FormData) {
  return {
    order: Number(formData.get("order") ?? 0),
    active: formData.get("active") === "on",
    verseRefVi: String(formData.get("verseRefVi") ?? ""),
    verseRefEn: String(formData.get("verseRefEn") ?? ""),
    textVi: String(formData.get("textVi") ?? ""),
    textEn: String(formData.get("textEn") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? "") || undefined,
  };
}

export async function createHeroSlideAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const res = await apiCreateHeroSlide(readHeroSlideForm(formData));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/content");
  redirect("/content");
}

export async function updateHeroSlideAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const res = await apiUpdateHeroSlide(id, readHeroSlideForm(formData));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/content");
  redirect("/content");
}

export async function deleteHeroSlideAction(id: string): Promise<ActionResult> {
  const res = await apiDeleteHeroSlide(id);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/content");
  return { ok: true };
}

// --- Site content: promo tiles ---------------------------------------------------

function readPromoTileForm(formData: FormData) {
  return {
    order: Number(formData.get("order") ?? 0),
    active: formData.get("active") === "on",
    labelVi: String(formData.get("labelVi") ?? ""),
    labelEn: String(formData.get("labelEn") ?? ""),
    href: String(formData.get("href") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? "") || undefined,
  };
}

export async function createPromoTileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const res = await apiCreatePromoTile(readPromoTileForm(formData));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/content");
  redirect("/content");
}

export async function updatePromoTileAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const res = await apiUpdatePromoTile(id, readPromoTileForm(formData));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/content");
  redirect("/content");
}

export async function deletePromoTileAction(id: string): Promise<ActionResult> {
  const res = await apiDeletePromoTile(id);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/content");
  return { ok: true };
}

// --- Images --------------------------------------------------------------------

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Upload a single image file. The token lives in an httpOnly cookie the
 * browser cannot read, so this has to run server-side even though the file
 * itself comes straight from a client-side <input type="file">.
 */
export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file selected." };
  }
  const res = await apiUploadImage(file);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, url: res.data.url };
}
