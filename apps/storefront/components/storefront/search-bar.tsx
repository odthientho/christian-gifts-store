"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar({
  placeholder,
  label,
}: {
  placeholder: string;
  label: string;
}) {
  const [q, setQ] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full" role="search">
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-11 w-full rounded-l-full border border-r-0 bg-card px-5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary/60"
      />
      <button
        type="submit"
        aria-label={label}
        className="grid h-11 w-14 shrink-0 place-items-center rounded-r-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Search className="size-5" strokeWidth={2} />
      </button>
    </form>
  );
}
