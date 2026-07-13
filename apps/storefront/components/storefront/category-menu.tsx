"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, ChevronDown, BookOpen, Gift } from "lucide-react";

import { cn } from "@/lib/utils";

type Category = { slug: string; name: string };

type Labels = {
  categories: string;
  books: string;
  gifts: string;
  allBooks: string;
  allGifts: string;
};

/**
 * The "Danh mục / Categories" mega-dropdown from the reference nav bar. Opens on
 * click, closes on outside-click or Escape. Groups categories under Books and
 * Gifts, each translated by the caller.
 */
export function CategoryMenu({
  bookCategories,
  giftCategories,
  labels,
}: {
  bookCategories: Category[];
  giftCategories: Category[];
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold uppercase tracking-wide text-primary-foreground"
      >
        <Menu className="size-4" strokeWidth={2.25} />
        {labels.categories}
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          strokeWidth={2.25}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[min(90vw,34rem)] rounded-xl border bg-popover p-4 shadow-xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <MenuColumn
              icon={<BookOpen className="size-4" strokeWidth={1.75} />}
              title={labels.books}
              allHref="/books"
              allLabel={labels.allBooks}
              basePath="/books"
              categories={bookCategories}
              onNavigate={() => setOpen(false)}
            />
            <MenuColumn
              icon={<Gift className="size-4" strokeWidth={1.75} />}
              title={labels.gifts}
              allHref="/gifts"
              allLabel={labels.allGifts}
              basePath="/gifts"
              categories={giftCategories}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuColumn({
  icon,
  title,
  allHref,
  allLabel,
  basePath,
  categories,
  onNavigate,
}: {
  icon: React.ReactNode;
  title: string;
  allHref: string;
  allLabel: string;
  basePath: string;
  categories: Category[];
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 border-b pb-2 text-sm font-semibold text-primary">
        {icon}
        {title}
      </p>
      <ul className="space-y-0.5 text-sm">
        <li>
          <Link
            href={allHref}
            onClick={onNavigate}
            className="block rounded-md px-2 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {allLabel}
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`${basePath}?category=${c.slug}`}
              onClick={onNavigate}
              className="block rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
