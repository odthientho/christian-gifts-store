import Link from "next/link";

import { getDictionary } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";

export default async function NotFound() {
  const dict = await getDictionary();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-28">
      <div className="text-center">
        <p className="font-heading text-6xl font-semibold text-primary/25">
          404
        </p>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">
          {dict.notFound.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{dict.notFound.sub}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={buttonVariants()}>
            {dict.notFound.home}
          </Link>
          <Link
            href="/books"
            className={buttonVariants({ variant: "outline" })}
          >
            {dict.notFound.books}
          </Link>
        </div>
      </div>
    </main>
  );
}
