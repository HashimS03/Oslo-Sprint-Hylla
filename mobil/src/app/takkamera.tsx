import { router } from "expo-router";
import { Knapp, Skjerm, Txt } from "@/components/ui";
import { F } from "@/lib/tema";

/**
 * Takkamera (Daniels del): samler skjermene for takkamera-demoen bak én knapp på startsiden.
 * 1) lag en hylle, 2) velg produkt for kamerasonen, 3) skann varene (plukk/plassering) mens kameraet følger med.
 */
export default function Takkamera() {
  return (
    <Skjerm tittel="Takkamera">
      <Txt style={{ color: F.dempet, fontSize: 16, lineHeight: 22 }}>
        Kameraet i taket ser hvor varene tas fra og settes. Skann varene du plukker eller plasserer, så sier Hylla fra med en gang hvis noe ikke stemmer.
      </Txt>
      <Knapp tekst="Plukk og plassering" undertekst="Skann varene du flytter" ikon="skann" pil onPress={() => router.push("/skann")} />
      <Knapp tekst="Kamerasoner" undertekst="Velg produkt for hver sone" ikon="kamera" variant="hvit" pil onPress={() => router.push("/kameraer")} />
      <Knapp tekst="Lag en hylle" ikon="pluss" variant="hvit" pil onPress={() => router.push("/ny-hylle")} />
    </Skjerm>
  );
}
