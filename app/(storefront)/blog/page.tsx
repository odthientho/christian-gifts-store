import type { Metadata } from "next";
import { Newspaper } from "lucide-react";

import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.blog.title };
}

export default async function BlogPage() {
  const dict = await getDictionary();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {dict.blog.title}
      </h1>
      <p className="mt-3 leading-relaxed text-pretty text-muted-foreground">
        {dict.blog.intro}
      </p>

      <div className="mt-10 rounded-xl border border-dashed py-20 text-center">
        <Newspaper
          className="mx-auto size-8 text-muted-foreground/50"
          strokeWidth={1.5}
        />
        <p className="mt-3 text-muted-foreground">{dict.blog.empty}</p>
      </div>
    </div>
  );
}
