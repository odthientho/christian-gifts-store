"use client";

import { useRef, useState, useTransition } from "react";

import { uploadImageAction } from "@/server/actions";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/** `/images/xyz` (what the API returns) -> an absolute, browser-loadable URL. */
function toAbsolute(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}

/**
 * A file input that uploads immediately on selection and writes the resulting
 * URL into a hidden `name="imageUrl"` field, so the surrounding <form> submits
 * it exactly like any other field — the parent form doesn't need to know
 * whether the image came from an upload or was typed in.
 */
export function ImageUpload({
  name = "imageUrl",
  initialUrl,
}: {
  name?: string;
  initialUrl?: string | null;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const body = new FormData();
    body.append("file", file);

    startTransition(async () => {
      const res = await uploadImageAction(body);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setUrl(res.url);
    });
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-4">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border bg-neutral-50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={toAbsolute(url)} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs text-neutral-400">No image</span>
          )}
        </div>

        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-60"
          >
            {pending ? "Uploading…" : url ? "Replace image" : "Upload image"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onSelect}
            className="hidden"
          />
          <p className="mt-1 text-xs text-neutral-400">JPEG, PNG, WebP, or GIF. Max 5 MB.</p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
