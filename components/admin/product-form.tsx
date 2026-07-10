"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { productSchema } from "@/lib/validations/product";
import { createProductAction, updateProductAction } from "@/server/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Category = { id: string; name: string };

export type ProductFormValues = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  type: "BOOK" | "GIFT";
  priceDollars: string;
  imageUrl: string;
  stock: string;
  active: boolean;
  featured: boolean;
  categoryId: string;
  book: {
    author: string;
    isbn: string;
    publisher: string;
    pageCount: string;
    language: string;
    format: "HARDCOVER" | "PAPERBACK" | "EBOOK" | "AUDIOBOOK";
  };
  gift: {
    material: string;
    dimensions: string;
    occasion: string;
    handmade: boolean;
  };
};

export const emptyProduct: ProductFormValues = {
  slug: "",
  title: "",
  description: "",
  type: "BOOK",
  priceDollars: "",
  imageUrl: "",
  stock: "0",
  active: true,
  featured: false,
  categoryId: "",
  book: {
    author: "",
    isbn: "",
    publisher: "",
    pageCount: "",
    language: "English",
    format: "PAPERBACK",
  },
  gift: { material: "", dimensions: "", occasion: "", handmade: false },
};

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormValues;
  categories: Category[];
}) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const isEdit = Boolean(initial.id);

  function submit(e: React.FormEvent) {
    e.preventDefault();

    // Shape the form's strings into what the shared Zod schema expects. The
    // same schema then runs again server-side — this is convenience, not a
    // security boundary.
    const payload = {
      slug: values.slug,
      title: values.title,
      description: values.description,
      type: values.type,
      priceDollars: Number(values.priceDollars),
      imageUrl: values.imageUrl,
      stock: Number(values.stock),
      active: values.active,
      featured: values.featured,
      categoryId: values.categoryId,
      ...(values.type === "BOOK"
        ? {
            book: {
              ...values.book,
              pageCount: values.book.pageCount
                ? Number(values.book.pageCount)
                : undefined,
              isbn: values.book.isbn || undefined,
              publisher: values.book.publisher || undefined,
            },
          }
        : {
            gift: {
              ...values.gift,
              material: values.gift.material || undefined,
              dimensions: values.gift.dimensions || undefined,
              occasion: values.gift.occasion || undefined,
            },
          }),
    };

    const parsed = productSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateProductAction(initial.id!, payload)
        : await createProductAction(payload);

      if (result.ok) {
        toast.success(isEdit ? "Product updated" : "Product created");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function set<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="title">
          <Input
            id="title"
            required
            value={values.title}
            onChange={(e) => {
              const title = e.target.value;
              setValues((v) => ({
                ...v,
                title,
                // Auto-slug only while creating, so editing never silently
                // changes a live URL.
                slug: isEdit ? v.slug : slugify(title),
              }));
            }}
          />
        </Field>

        <Field label="Slug" htmlFor="slug">
          <Input
            id="slug"
            required
            value={values.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          required
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type" htmlFor="type">
          <select
            id="type"
            value={values.type}
            onChange={(e) => set("type", e.target.value as "BOOK" | "GIFT")}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="BOOK">Book</option>
            <option value="GIFT">Gift</option>
          </select>
        </Field>

        <Field label="Price (USD)" htmlFor="price">
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={values.priceDollars}
            onChange={(e) => set("priceDollars", e.target.value)}
          />
        </Field>

        <Field label="Stock" htmlFor="stock">
          <Input
            id="stock"
            type="number"
            min="0"
            required
            value={values.stock}
            onChange={(e) => set("stock", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="category">
          <select
            id="category"
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Image URL (optional)" htmlFor="imageUrl">
          <Input
            id="imageUrl"
            type="url"
            value={values.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex gap-6">
        <Checkbox
          label="Active"
          checked={values.active}
          onChange={(v) => set("active", v)}
        />
        <Checkbox
          label="Featured"
          checked={values.featured}
          onChange={(v) => set("featured", v)}
        />
      </div>

      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium">
          {values.type === "BOOK" ? "Book details" : "Gift details"}
        </legend>

        {values.type === "BOOK" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author" htmlFor="author">
              <Input
                id="author"
                required
                value={values.book.author}
                onChange={(e) =>
                  set("book", { ...values.book, author: e.target.value })
                }
              />
            </Field>
            <Field label="Publisher" htmlFor="publisher">
              <Input
                id="publisher"
                value={values.book.publisher}
                onChange={(e) =>
                  set("book", { ...values.book, publisher: e.target.value })
                }
              />
            </Field>
            <Field label="Format" htmlFor="format">
              <select
                id="format"
                value={values.book.format}
                onChange={(e) =>
                  set("book", {
                    ...values.book,
                    format: e.target.value as ProductFormValues["book"]["format"],
                  })
                }
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="PAPERBACK">Paperback</option>
                <option value="HARDCOVER">Hardcover</option>
                <option value="EBOOK">eBook</option>
                <option value="AUDIOBOOK">Audiobook</option>
              </select>
            </Field>
            <Field label="Pages" htmlFor="pageCount">
              <Input
                id="pageCount"
                type="number"
                min="1"
                value={values.book.pageCount}
                onChange={(e) =>
                  set("book", { ...values.book, pageCount: e.target.value })
                }
              />
            </Field>
            <Field label="Language" htmlFor="language">
              <Input
                id="language"
                value={values.book.language}
                onChange={(e) =>
                  set("book", { ...values.book, language: e.target.value })
                }
              />
            </Field>
            <Field label="ISBN" htmlFor="isbn">
              <Input
                id="isbn"
                value={values.book.isbn}
                onChange={(e) =>
                  set("book", { ...values.book, isbn: e.target.value })
                }
              />
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Material" htmlFor="material">
              <Input
                id="material"
                value={values.gift.material}
                onChange={(e) =>
                  set("gift", { ...values.gift, material: e.target.value })
                }
              />
            </Field>
            <Field label="Dimensions" htmlFor="dimensions">
              <Input
                id="dimensions"
                value={values.gift.dimensions}
                onChange={(e) =>
                  set("gift", { ...values.gift, dimensions: e.target.value })
                }
              />
            </Field>
            <Field label="Occasion" htmlFor="occasion">
              <Input
                id="occasion"
                value={values.gift.occasion}
                onChange={(e) =>
                  set("gift", { ...values.gift, occasion: e.target.value })
                }
              />
            </Field>
            <div className="flex items-end">
              <Checkbox
                label="Handmade"
                checked={values.gift.handmade}
                onChange={(v) => set("gift", { ...values.gift, handmade: v })}
              />
            </div>
          </div>
        )}
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border"
      />
      {label}
    </label>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
