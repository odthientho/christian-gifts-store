import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/generated/prisma/enums";

// Teach TypeScript that our session and JWT carry a `role`, so that
// `session.user.role` is type-checked rather than `any`.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}

// `next-auth/jwt` only re-exports (`export * from "@auth/core/jwt"`), so it owns
// no JWT interface to merge into. Augment the module that actually declares it.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
