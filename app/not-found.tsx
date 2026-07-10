import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-28">
      <div className="text-center">
        <p className="font-heading text-6xl font-semibold text-primary/25">
          404
        </p>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-muted-foreground">
          The link may be old, or the item may no longer be for sale.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={buttonVariants()}>
            Back to the store
          </Link>
          <Link
            href="/books"
            className={buttonVariants({ variant: "outline" })}
          >
            Browse books
          </Link>
        </div>
      </div>
    </main>
  );
}
