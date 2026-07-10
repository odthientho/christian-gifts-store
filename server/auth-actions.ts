"use server";

import { AuthError } from "next-auth";
import { unstable_rethrow } from "next/navigation";

import { db } from "@/lib/db";
import { signIn, hashPassword } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type AuthActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(
  input: unknown,
  callbackUrl?: string,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallback(callbackUrl),
    });
    return { ok: true };
  } catch (error) {
    // A successful `signIn` signals its redirect by throwing. `unstable_rethrow`
    // re-throws Next's control-flow errors and returns for anything else, so
    // the browser still navigates.
    unstable_rethrow(error);

    if (error instanceof AuthError) {
      // Deliberately vague: never reveal whether the email exists.
      return { ok: false, error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "That email cannot be registered." };
  }

  await db.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      // Role never comes from user input. New accounts are always USER; an
      // admin is promoted deliberately, out of band.
      role: "USER",
    },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/",
    });
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    throw error;
  }
}

/**
 * Only allow redirects back into this site. An attacker who can choose
 * `?callbackUrl=https://evil.example` would otherwise turn the login page into
 * an open redirect.
 */
function safeCallback(url: string | undefined): string {
  if (!url) return "/";
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}
