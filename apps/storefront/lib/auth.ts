import { cache } from "react";
import { redirect } from "next/navigation";

import type { RoleDTO } from "@gin/contracts";
import { apiMe } from "@/lib/api-client";
import { getSessionToken } from "@/lib/session";

// Customer identity now comes from the API. The storefront holds only the
// session token (httpOnly cookie) and asks the API who it belongs to — it has
// no database and no password handling of its own.

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: RoleDTO;
};

/**
 * The signed-in customer, or null. Wrapped in React `cache` so the header,
 * cart, and page all share one /auth/me call per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getSessionToken();
  const user = await apiMe(token);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
});

/** Gate for pages that need any signed-in user. */
export async function requireUser(callbackUrl = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}
