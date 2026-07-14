import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed `middleware` to `proxy`. Same behaviour, node runtime.
// Its only job now is to attach a per-request CSP nonce and security headers;
// auth and rate limiting live in the API and the auth Server Actions.

export function proxy(request: NextRequest) {
  // CSP. A fresh nonce per request; Next attaches it to its own scripts.
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
    // Product images may be hosted anywhere the admin points them. In dev the
    // API itself serves uploaded images over plain http (localhost:4000), so
    // http: is allowed only there — production traffic to the API is https.
    `img-src 'self' blob: data: https:${isDev ? " http:" : ""}`,
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
