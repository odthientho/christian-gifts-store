import Link from "next/link";

import { getDictionary } from "@/lib/i18n";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getDictionary();

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent)]"
      />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center font-heading text-2xl font-semibold tracking-tight"
        >
          Hải Đăng<span className="text-primary">.</span>
        </Link>
        {children}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            {dict.auth.back}
          </Link>
        </p>
      </div>
    </main>
  );
}
