import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.auth.signInTitle };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [{ callbackUrl }, dict] = await Promise.all([
    searchParams,
    getDictionary(),
  ]);

  if (await getCurrentUser()) redirect("/");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.auth.signInTitle}</CardTitle>
        <CardDescription>{dict.auth.signInDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          callbackUrl={callbackUrl}
          labels={{
            email: dict.auth.email,
            password: dict.auth.password,
            signIn: dict.auth.signIn,
            signingIn: dict.auth.signingIn,
            noAccount: dict.auth.noAccount,
            createOne: dict.auth.createOne,
          }}
        />
      </CardContent>
    </Card>
  );
}
