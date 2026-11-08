import type { MatcherAvvikType } from "./types";

// Navn på avviktypene, uten server-only, så de kan brukes overalt.
const TITTEL: Record<MatcherAvvikType, string> = {
  feil_vare: "Feil produkt",
  feil_plass: "Feil plass",
  uregistrert_uttak: "Uregistrert uttak",
  skannet_uten_uttak: "Skannet uten uttak",
  mulig_feilplassert: "Mulig feilplassert vare",
  gjenglemt: "Gjenglemt vare",
};
export const avvikTittel = (type: MatcherAvvikType) => TITTEL[type];
