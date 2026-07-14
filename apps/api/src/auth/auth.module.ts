import { Module, Global } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { TokenService } from "./jwt.strategy.js";
import { JwtAuthGuard, RolesGuard, OptionalJwtGuard } from "./guards.js";
import { CartModule } from "../cart/cart.module.js";

// Global so any module can apply JwtAuthGuard / RolesGuard without re-importing.
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "7d" },
    }),
    // So login can fold a guest cart into the signed-in user's cart.
    CartModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtAuthGuard, RolesGuard, OptionalJwtGuard],
  exports: [TokenService, JwtAuthGuard, RolesGuard, OptionalJwtGuard],
})
export class AuthModule {}
