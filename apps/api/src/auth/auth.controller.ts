import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
  type JwtClaims,
} from "@gin/contracts";

import { AuthService } from "./auth.service.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { JwtAuthGuard, CurrentUser } from "./guards.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Tighter throttle on credential endpoints than the global limit: brute-force
  // defence at the boundary. 8 attempts / 10 min per IP.
  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { ttl: 600_000, limit: 8 } })
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body);
  }

  @Post("register")
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
  ) {
    return this.auth.register(body);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtClaims) {
    return this.auth.me(user.sub);
  }
}
