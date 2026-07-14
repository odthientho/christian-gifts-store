"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { PromoTileDTO } from "@gin/contracts";

import type { ActionResult } from "@/server/actions";
import { ImageUpload } from "@/components/image-upload";

type Action = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

export function PromoTileForm({
  action,
  tile,
}: {
  action: Action;
  tile?: PromoTileDTO;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="max-w-md space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Label (VI)" name="labelVi" defaultValue={tile?.labelVi} required />
        <Field label="Label (EN)" name="labelEn" defaultValue={tile?.labelEn} required />
      </div>

      <Field
        label="Link (path starting with /)"
        name="href"
        defaultValue={tile?.href}
        required
        hint="e.g. /gifts"
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Photo (optional)</label>
        <ImageUpload name="imageUrl" initialUrl={tile?.imageUrl} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Order"
          name="order"
          type="number"
          defaultValue={tile?.order?.toString() ?? "0"}
        />
        <div className="flex items-end pb-2.5">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={tile?.active ?? true} />
            Active
          </label>
        </div>
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
          {pending ? "Saving…" : tile ? "Save changes" : "Create tile"}
        </button>
        <Link
          href="/content"
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
