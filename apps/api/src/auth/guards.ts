import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
  createParamDecorator,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { JwtClaims, RoleDTO } from "@gin/contracts";

import { TokenService } from "./jwt.strategy.js";

type AuthedRequest = Request & { user?: JwtClaims };

/**
 * Verifies the Bearer token and attaches the claims to the request. This is the
 * authentication check — it runs server-side on every guarded route. A UI
 * hiding a control is never a substitute.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new UnauthorizedException();
    try {
      req.user = this.tokens.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

export const ROLES_KEY = "roles";
/** `@Roles("ADMIN")` on a handler requires that role after JwtAuthGuard runs. */
export const Roles = (...roles: RoleDTO[]) => SetMetadata(ROLES_KEY, roles);

/** Enforces `@Roles(...)`. Must run after JwtAuthGuard so `req.user` is set. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleDTO[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const role = req.user?.role;
    if (!role || !required.includes(role)) throw new ForbiddenException();
    return true;
  }
}

/** `@CurrentUser()` injects the verified claims into a handler param. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtClaims | undefined => {
    return context.switchToHttp().getRequest<AuthedRequest>().user;
  },
);
