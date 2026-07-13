import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
import { prisma } from "@gin/db";
import type {
  LoginInput,
  RegisterInput,
  AuthResponse,
  AuthUserDTO,
} from "@gin/contracts";

import { TokenService } from "./jwt.strategy.js";

const BCRYPT_COST = 12;

// A valid bcrypt digest of a throwaway string. Comparing an unknown email
// against this costs the same time as a real password check, so login timing
// cannot be used to tell which emails have accounts. It must be a well-formed
// digest at the same cost as BCRYPT_COST — bcrypt returns instantly on a
// malformed string, which would reopen the timing gap.
const DUMMY_HASH =
  "$2b$12$Li6frJJ3frF5iGtwC1H.eeBMzp0tutsvROvSmtNTnl3PRdSVpRp/e";

@Injectable()
export class AuthService {
  constructor(private readonly tokens: TokenService) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("An account with that email already exists");
    }
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const user = await prisma.user.create({
      data: { email, name: input.name, passwordHash, role: "USER" },
    });
    return this.issue(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const email = input.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    const hash = user?.passwordHash ?? DUMMY_HASH;
    const ok = await bcrypt.compare(input.password, hash);
    if (!ok || !user?.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issue(user);
  }

  async me(userId: string): Promise<AuthUserDTO> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.toUserDTO(user);
  }

  private issue(user: {
    id: string;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
  }): AuthResponse {
    const token = this.tokens.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { token, user: this.toUserDTO(user) };
  }

  private toUserDTO(user: {
    id: string;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
  }): AuthUserDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
