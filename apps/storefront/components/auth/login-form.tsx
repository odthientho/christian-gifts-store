"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { loginAction } from "@/server/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type LoginLabels = {
  email: string;
  password: string;
  signIn: string;
  signingIn: string;
  noAccount: string;
  createOne: string;
};

export function LoginForm({
  callbackUrl,
  labels,
}: {
  callbackUrl?: string;
  labels: LoginLabels;
}) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await loginAction({ email, password }, callbackUrl);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{labels.email}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{labels.password}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? labels.signingIn : labels.signIn}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {labels.noAccount}{" "}
        <Link href="/register" className="underline hover:text-foreground">
          {labels.createOne}
        </Link>
      </p>
    </form>
  );
}
