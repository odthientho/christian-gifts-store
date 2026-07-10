import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed `middleware` to `proxy`. Same behaviour, node runtime.
//
// This is an optimistic redirect only — a cheap way to bounce signed-out
// visitors off /admin without rendering it. It is NOT the authorization check.
// It reads a cookie's presence and cannot verify the signature or the role.
// Every /admin page and every admin Server Action calls `requireAdmin()`
// server-side; that is what actually enforces access.

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );

  if (!hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
