import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

/**
 * Guards admin-only endpoints. For the Products slice this checks a static
 * bearer token (ADMIN_API_TOKEN) sent by the admin app's server. The full auth
 * slice replaces this with verified JWTs carrying a role claim — the guard is
 * the single seam where that swap happens, so no controller changes.
 *
 * This is the authorization check. It runs server-side on every admin request;
 * hiding a button in the admin UI is not access control.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) {
      // Fail closed: a missing server secret must never mean "allow".
      throw new UnauthorizedException();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (token !== expected) throw new UnauthorizedException();
    return true;
  }
}
