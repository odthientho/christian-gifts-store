import { Module, Global } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { TokenService } from "./jwt.strategy.js";
import { JwtAuthGuard, RolesGuard } from "./guards.js";

// Global so any module can apply JwtAuthGuard / RolesGuard without re-importing.
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtAuthGuard, RolesGuard],
  exports: [TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
