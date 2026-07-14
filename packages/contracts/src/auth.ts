import { z } from "zod";

export const ROLES = ["USER", "ADMIN"] as const;
export type RoleDTO = (typeof ROLES)[number];

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  // If the browser is carrying a guest cart, its token — so the API can fold
  // that cart's items into the signed-in user's cart as part of login.
  cartToken: z.string().min(1).max(64).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(200),
  // Same as loginSchema.cartToken: a new account plausibly started as a guest
  // cart too.
  cartToken: z.string().min(1).max(64).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export type AuthUserDTO = {
  id: string;
  email: string;
  name: string | null;
  role: RoleDTO;
};

/** Returned by /auth/login and /auth/register. */
export type AuthResponse = {
  token: string;
  user: AuthUserDTO;
};

/** The verified JWT payload the API signs and the UIs never construct. */
export type JwtClaims = {
  sub: string;
  email: string;
  role: RoleDTO;
};
