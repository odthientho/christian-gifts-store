import { notFound } from "next/navigation";

import { apiAdminHeroSlides } from "@/lib/api";
import { updateHeroSlideAction } from "@/server/actions";
import { HeroSlideForm } from "@/components/hero-slide-form";

export default async function EditHeroSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const slides = await apiAdminHeroSlides();
  const slide = slides.find((s) => s.id === id);
  if (!slide) notFound();

  const action = updateHeroSlideAction.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit hero slide</h1>
      <HeroSlideForm action={action} slide={slide} />
    </div>
  );
}
