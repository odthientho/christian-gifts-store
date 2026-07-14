import Link from "next/link";

import { apiAdminHeroSlides, apiAdminPromoTiles } from "@/lib/api";
import { DeleteButton } from "@/components/delete-button";
import { deleteHeroSlideAction, deletePromoTileAction } from "@/server/actions";

export default async function ContentPage() {
  const [slides, tiles] = await Promise.all([
    apiAdminHeroSlides(),
    apiAdminPromoTiles(),
  ]);

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Hero carousel slides</h1>
          <Link
            href="/content/hero/new"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
          >
            New slide
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5">Order</th>
                  <th className="px-4 py-2.5">Verse ref (EN)</th>
                  <th className="px-4 py-2.5">Active</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {slides.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2.5 text-neutral-500">{s.order}</td>
                    <td className="px-4 py-2.5 font-medium">{s.verseRefEn}</td>
                    <td className="px-4 py-2.5">{s.active ? "Yes" : "No"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/content/hero/${s.id}/edit`}
                        className="text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        itemLabel={`slide "${s.verseRefEn}"`}
                        action={deleteHeroSlideAction.bind(null, s.id)}
                        successMessage={`Deleted slide "${s.verseRefEn}".`}
                      />
                    </td>
                  </tr>
                ))}
                {slides.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                      No slides yet — the carousel falls back to defaults.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Promo tiles</h1>
          <Link
            href="/content/promo/new"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
          >
            New tile
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5">Order</th>
                  <th className="px-4 py-2.5">Label (EN)</th>
                  <th className="px-4 py-2.5">Link</th>
                  <th className="px-4 py-2.5">Active</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tiles.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2.5 text-neutral-500">{t.order}</td>
                    <td className="px-4 py-2.5 font-medium">{t.labelEn}</td>
                    <td className="px-4 py-2.5 text-neutral-500">{t.href}</td>
                    <td className="px-4 py-2.5">{t.active ? "Yes" : "No"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/content/promo/${t.id}/edit`}
                        className="text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        itemLabel={`tile "${t.labelEn}"`}
                        action={deletePromoTileAction.bind(null, t.id)}
                        successMessage={`Deleted tile "${t.labelEn}".`}
                      />
                    </td>
                  </tr>
                ))}
                {tiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                      No tiles yet — the homepage falls back to defaults.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
