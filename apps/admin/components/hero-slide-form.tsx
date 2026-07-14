"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { HeroSlideDTO } from "@gin/contracts";

import type { ActionResult } from "@/server/actions";
import { ImageUpload } from "@/components/image-upload";

type Action = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

export function HeroSlideForm({
  action,
  slide,
}: {
  action: Action;
  slide?: HeroSlideDTO;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="max-w-md space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Verse ref (VI)" name="verseRefVi" defaultValue={slide?.verseRefVi} required />
        <Field label="Verse ref (EN)" name="verseRefEn" defaultValue={slide?.verseRefEn} required />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Text (VI)</label>
        <textarea
          name="textVi"
          required
          rows={3}
          defaultValue={slide?.textVi}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Text (EN)</label>
        <textarea
          name="textEn"
          required
          rows={3}
          defaultValue={slide?.textEn}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Photo (optional)</label>
        <ImageUpload name="imageUrl" initialUrl={slide?.imageUrl} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Order"
          name="order"
          type="number"
          defaultValue={slide?.order?.toString() ?? "0"}
        />
        <div className="flex items-end pb-2.5">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={slide?.active ?? true} />
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
          {pending ? "Saving…" : slide ? "Save changes" : "Create slide"}
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
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        {...props}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
