import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { JwtClaims } from "@gin/contracts";

/**
 * Signs and verifies the API's access tokens. The secret is server-only; the
 * UIs receive a token but never mint or inspect one — the API is the single
 * authority on identity and role.
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(claims: JwtClaims): string {
    return this.jwt.sign(claims);
  }

  verify(token: string): JwtClaims {
    // Throws if expired or tampered; callers turn that into a 401.
    return this.jwt.verify<JwtClaims>(token);
  }
}
