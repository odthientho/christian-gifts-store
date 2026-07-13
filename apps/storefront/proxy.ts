import { NextResponse, type NextRequest } from "next/server";

import { clientIp, rateLimit, LIMITS } from "@/lib/rate-limit";

// Next.js 16 renamed `middleware` to `proxy`. Same behaviour, node runtime.
//
// Three jobs, in order:
//   1. Rate-limit the credentials sign-in endpoint (brute-force defence).
//   2. Bounce signed-out visitors off /admin — an *optimistic* redirect only.
//   3. Attach a per-request CSP nonce and the security headers.
//
// (2) is NOT the authorization check. It reads a cookie's presence and cannot
// verify the signature or the role, and it never runs before a Server Action.
// Every /admin page and every admin Server Action calls `requireAdmin()`
// server-side; that is what actually enforces access.

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const CREDENTIALS_ENDPOINT = "/api/auth/callback/credentials";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Brute-force defence on the sign-in endpoint. Server Actions call
  //    `signIn` in-process, so `loginAction` limits itself separately — this
  //    covers anyone POSTing the Auth.js endpoint directly, as a script would.
  if (pathname === CREDENTIALS_ENDPOINT && request.method === "POST") {
    const ip = clientIp(request.headers);
    const { ok, retryAfter } = rateLimit(
      `login:${ip}`,
      LIMITS.login.limit,
      LIMITS.login.windowMs,
    );
    if (!ok) {
      return new NextResponse("Too many sign-in attempts. Try again later.", {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      });
    }
  }

  // 2. Optimistic /admin redirect.
  if (pathname.startsWith("/admin")) {
    const hasSession = SESSION_COOKIES.some((name) =>
      request.cookies.has(name),
    );
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 3. CSP. A fresh nonce per request; Next attaches it to its own scripts.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    `default-src 'self'`,
    // 'strict-dynamic' means scripts loaded by a nonced script are trusted too,
    // which is what lets Next's chunk loader work under a strict policy.
    // React uses eval() in development to rebuild server stacks; not in prod.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // 'unsafe-inline' for styles only. Tailwind v4 and Sonner inject style tags
    // at runtime that a nonce cannot cover. Style injection is a far weaker
    // vector than script injection, and script-src stays strict.
    `style-src 'self' 'unsafe-inline'`,
    // Product images may be hosted anywhere the admin points them.
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self'`,
    // Stripe Checkout is a top-level redirect, never framed.
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Everything except static assets and image optimisation, which need no CSP
  // and would only pay the cost of running this.
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
