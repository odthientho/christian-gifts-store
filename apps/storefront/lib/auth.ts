import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import type { Role } from "@/lib/generated/prisma/enums";

// Session strategy is JWT, not database. Auth.js only supports the Credentials
// provider with JWT sessions — a credentials sign-in never creates an adapter
// Session row. The adapter stays wired up so adding an OAuth provider later
// persists users without a migration.

const adapter = PrismaAdapter(db as never);

/** Cost factor for password hashing. Kept in sync with DUMMY_HASH below. */
const BCRYPT_COST = 12;

/** A valid bcrypt digest of a throwaway string. See `authorize` for why. */
const DUMMY_HASH =
  "$2b$12$Li6frJJ3frF5iGtwC1H.eeBMzp0tutsvROvSmtNTnl3PRdSVpRp/e";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        // A user created purely through OAuth has no passwordHash. Compare
        // against DUMMY_HASH anyway so an unknown email costs the same time as
        // a wrong password, and the response cannot be used to enumerate which
        // emails have accounts. DUMMY_HASH must be a well-formed bcrypt digest
        // at the same cost factor as hashPassword: bcrypt.compare returns
        // immediately on a malformed string, which would restore the timing gap.
        const hash = user?.passwordHash ?? DUMMY_HASH;

        const ok = await bcrypt.compare(password, hash);
        if (!ok || !user?.passwordHash) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on initial sign-in.
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Re-read the role on later requests so that revoking admin takes effect
      // without waiting for the token to expire.
      if (!user && token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        });
        if (fresh) token.role = fresh.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
  trustHost: true,
});

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
};

/** The signed-in user, or null. Safe to call from any Server Component. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name,
    role: session.user.role,
  };
}

/**
 * Gate for every /admin page and every admin Server Action.
 *
 * This is the authorization check. Hiding a nav link, or matching a path in
 * proxy.ts, is not — both run before this and neither can be trusted. Call
 * this inside the page or action itself, every time.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** Gate for pages that need any signed-in user. */
export async function requireUser(callbackUrl = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/** Hash a plaintext password for storage. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}
