/** Rotating login hero (right panel). New random index on each page visit (mount). */
export const LOGIN_HERO_VARIANT_COUNT = 5;

/** Background gradients for the right column — index aligns with hero variant. */
export const LOGIN_HERO_PANEL_GRADIENTS: readonly string[] = [
  "from-navy via-primary to-navy-light",
  "from-slate-950 via-primary to-navy",
  "from-primary via-navy to-slate-950",
  "from-navy-light via-primary/95 to-slate-900",
  "from-slate-900 via-navy-light to-primary",
];
