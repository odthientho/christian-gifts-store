"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { CategoryDTO } from "@gin/contracts";

import type { ActionResult } from "@/server/actions";
import { ImageUpload } from "@/components/image-upload";

type Action = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

export function CategoryForm({
  action,
  category,
}: {
  action: Action;
  category?: CategoryDTO;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="max-w-md space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Name</label>
        <input
          name="name"
          required
          defaultValue={category?.name}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Slug</label>
        <input
          name="slug"
          required
          defaultValue={category?.slug}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <p className="text-xs text-neutral-400">lowercase-with-hyphens</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Image</label>
        <ImageUpload name="imageUrl" initialUrl={category?.imageUrl} />
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
          {pending ? "Saving…" : category ? "Save changes" : "Create category"}
        </button>
        <Link
          href="/categories"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
