import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]"
      />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center font-heading text-2xl font-semibold tracking-tight"
        >
          Cornerstone<span className="text-brass">.</span>
        </Link>
        {children}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to the store
          </Link>
        </p>
      </div>
    </main>
  );
}
