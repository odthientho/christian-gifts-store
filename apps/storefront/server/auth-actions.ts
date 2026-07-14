"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { apiLogin, apiRegister } from "@/lib/api-client";
import { setSessionToken } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { clientIp, rateLimit, LIMITS } from "@/lib/rate-limit";

export type AuthActionResult = { ok: true } | { ok: false; error: string };

/**
 * A Server Action is a public HTTP endpoint, so it needs its own throttle in
 * front of the API call — belt and braces alongside the API's own per-route
 * limit. Returns the caller's IP (so it isn't computed twice) or an error
 * message if the caller is over the limit.
 */
async function throttle(
  bucket: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<{ ip: string; error: null } | { ip: null; error: string }> {
  const ip = clientIp(await headers());
  const { ok, retryAfter } = rateLimit(`${bucket}:${ip}`, limit, windowMs);
  if (ok) return { ip, error: null };
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  return {
    ip: null,
    error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  };
}

export async function loginAction(
  input: unknown,
  callbackUrl?: string,
): Promise<AuthActionResult> {
  const throttled = await throttle("login", LIMITS.login);
  if (throttled.ip === null) return { ok: false, error: throttled.error };

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  // Forward the real visitor IP: every storefront->API call otherwise arrives
  // from this server's single IP, which would make the API's own per-IP
  // throttle see one shared identity for the whole site instead of per visitor.
  const result = await apiLogin(
    parsed.data.email,
    parsed.data.password,
    throttled.ip,
  );
  // The API returns a deliberately vague message that never reveals whether the
  // email exists; surface it as-is.
  if (!result.ok) return { ok: false, error: result.error };

  await setSessionToken(result.data.token);
  redirect(safeCallback(callbackUrl));
}

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  const throttled = await throttle("register", LIMITS.register);
  if (throttled.ip === null) return { ok: false, error: throttled.error };

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const result = await apiRegister(
    parsed.data.name,
    parsed.data.email,
    parsed.data.password,
    throttled.ip,
  );
  if (!result.ok) return { ok: false, error: result.error };

  await setSessionToken(result.data.token);
  redirect("/");
}

/**
 * Only allow redirects back into this site. An attacker who can choose
 * `?callbackUrl=https://evil.example` would otherwise turn the login page into
 * an open redirect.
 */
function safeCallback(url: string | undefined): string {
  if (!url) return "/";
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}
