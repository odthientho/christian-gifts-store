"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ProductDTO, CategoryDTO } from "@gin/contracts";

import type { ActionResult } from "@/server/actions";
import { ImageUpload } from "@/components/image-upload";

type Action = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

export function ProductForm({
  action,
  product,
  categories,
}: {
  action: Action;
  product?: ProductDTO;
  categories: CategoryDTO[];
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <Field label="Title" name="title" defaultValue={product?.title} required />
      <Field
        label="Slug"
        name="slug"
        defaultValue={product?.slug}
        required
        hint="lowercase-with-hyphens"
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={product?.description}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Type</label>
          <select
            name="type"
            defaultValue={product?.type ?? "BOOK"}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="BOOK">Book</option>
            <option value="GIFT">Gift</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Category</label>
          <select
            name="categorySlug"
            defaultValue={product?.category?.slug ?? ""}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Price (USD)"
          name="priceDollars"
          type="number"
          step="0.01"
          defaultValue={product ? (product.priceCents / 100).toString() : ""}
          required
        />
        <Field
          label="Stock"
          name="stock"
          type="number"
          defaultValue={product?.stock?.toString() ?? "0"}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Image</label>
        <ImageUpload name="imageUrl" initialUrl={product?.imageUrl} />
      </div>

      <div className="flex gap-6">
        <Checkbox label="Active" name="active" defaultChecked={product?.active ?? true} />
        <Checkbox
          label="Featured"
          name="featured"
          defaultChecked={product?.featured ?? false}
        />
      </div>

      {state && !state.ok && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <Link
          href="/products"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        {...props}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
