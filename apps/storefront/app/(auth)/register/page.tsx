import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { RegisterForm } from "@/components/auth/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.auth.registerTitle };
}

export default async function RegisterPage() {
  const dict = await getDictionary();
  if (await getCurrentUser()) redirect("/");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.auth.registerTitle}</CardTitle>
        <CardDescription>{dict.auth.registerDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm
          labels={{
            name: dict.auth.name,
            email: dict.auth.email,
            password: dict.auth.password,
            minChars: dict.auth.minChars,
            createAccount: dict.auth.createAccount,
            creating: dict.auth.creating,
            haveAccount: dict.auth.haveAccount,
            signIn: dict.auth.signIn,
          }}
        />
      </CardContent>
    </Card>
  );
}
