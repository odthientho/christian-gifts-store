import { cookies } from "next/headers";

// The customer's API session token lives in an httpOnly cookie the browser
// cannot read. Only the storefront's server attaches it to API calls.

export const SESSION_COOKIE = "gin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matching the API token's lifetime

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setSessionToken(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
