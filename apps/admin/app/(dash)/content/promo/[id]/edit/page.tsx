import { notFound } from "next/navigation";

import { apiAdminPromoTiles } from "@/lib/api";
import { updatePromoTileAction } from "@/server/actions";
import { PromoTileForm } from "@/components/promo-tile-form";

export default async function EditPromoTilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tiles = await apiAdminPromoTiles();
  const tile = tiles.find((t) => t.id === id);
  if (!tile) notFound();

  const action = updatePromoTileAction.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit promo tile</h1>
      <PromoTileForm action={action} tile={tile} />
    </div>
  );
}
