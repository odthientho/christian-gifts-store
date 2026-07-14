import { createHeroSlideAction } from "@/server/actions";
import { HeroSlideForm } from "@/components/hero-slide-form";

export default function NewHeroSlidePage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New hero slide</h1>
      <HeroSlideForm action={createHeroSlideAction} />
    </div>
  );
}
