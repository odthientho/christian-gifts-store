import { redirect } from "next/navigation";

import { apiMe } from "@/lib/api";
import type { AuthUserDTO } from "@gin/contracts";

/**
 * Gate for every admin page. Verifies the token against the API and that the
 * user is an ADMIN. This is the real check — it runs server-side on each page
 * load. The token is opaque to this app; the API is the authority on the role.
 */
export async function requireAdmin(): Promise<AuthUserDTO> {
  const user = await apiMe();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/login?error=forbidden");
  return user;
}
