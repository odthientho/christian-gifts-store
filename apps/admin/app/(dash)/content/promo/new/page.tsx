import { createPromoTileAction } from "@/server/actions";
import { PromoTileForm } from "@/components/promo-tile-form";

export default function NewPromoTilePage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New promo tile</h1>
      <PromoTileForm action={createPromoTileAction} />
    </div>
  );
}
