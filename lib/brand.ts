// Brand identity in one place. The name and slogan are the same in every
// locale — a brand mark and its motto are not translated — so they live here as
// constants rather than in the i18n dictionaries.

export const BRAND_NAME = "GIN Store";

export const BRAND_SLOGAN = "Growing Faith. Inspiring Hope. Nurturing Love.";

// The slogan spells GIN: the leading G / I / N are emphasised when rendered so
// the acronym reads out of the motto.
export const BRAND_SLOGAN_PARTS = [
  { lead: "G", rest: "rowing Faith." },
  { lead: "I", rest: "nspiring Hope." },
  { lead: "N", rest: "urturing Love." },
] as const;
