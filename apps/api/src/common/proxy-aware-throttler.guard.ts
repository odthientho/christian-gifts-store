import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";

/**
 * The default ThrottlerGuard keys on `req.ip` — the TCP peer address. Every
 * request the storefront or admin app makes to this API arrives from that
 * app's own server, not from the visitor, so an unmodified `req.ip` throttle
 * would see one shared identity for every user of the site and rate-limit the
 * whole site as a single caller instead of per visitor.
 *
 * The storefront and admin apps forward the real visitor IP in
 * `x-forwarded-for` (see apps/storefront/lib/api-client.ts). That header is
 * trusted here — but only because `CORS_ORIGINS` / the deployment topology
 * restricts who can reach this API at all; if this API is ever exposed
 * directly to arbitrary browser traffic, a spoofed `x-forwarded-for` would
 * defeat throttling and this trust must be revisited (e.g. verify a shared
 * internal-service secret, or only trust the header from a known reverse
 * proxy IP).
 */
@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const forwarded = req.headers["x-forwarded-for"];
    const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const visitorIp = value?.split(",")[0]?.trim();
    return visitorIp || req.ip || "unknown";
  }

  // NestJS's default message is the literal string
  // "ThrottlerException: Too Many Requests" — an implementation detail, not
  // copy meant for an end user. Confirmed live: the storefront's login form
  // rendered that raw text verbatim in a toast. Every caller of this API would
  // otherwise have to know to special-case 429s to avoid showing it; fixing the
  // message here, rather than `throwThrottlingException`, keeps the default
  // Retry-After / throttle headers NestJS sets up before throwing.
  protected async getErrorMessage(): Promise<string> {
    return "Too many requests. Please wait a moment and try again.";
  }
}
