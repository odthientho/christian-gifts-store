"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { registerAction } from "@/server/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type RegisterLabels = {
  name: string;
  email: string;
  password: string;
  minChars: string;
  createAccount: string;
  creating: string;
  haveAccount: string;
  signIn: string;
};

export function RegisterForm({ labels }: { labels: RegisterLabels }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await registerAction({ name, email, password });
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{labels.name}</Label>
        <Input
          id="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{labels.minChars}</p>
      </div>

      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? labels.creating : labels.createAccount}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {labels.haveAccount}{" "}
        <Link href="/login" className="underline hover:text-foreground">
          {labels.signIn}
        </Link>
      </p>
    </form>
  );
}
