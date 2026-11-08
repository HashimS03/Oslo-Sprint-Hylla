import { Image, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import type { HylleRad, Kamera } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F, S, lagStil } from "@/lib/tema";
import { klokke, sistTalt } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { Chip, Etikett, Feilboks, Kort, Knapp, LenkeKnapp, Laster, Mono, Skjerm, Txt } from "@/components/ui";

export default function Kameraer() {
  const { data, feil, last } = useHent<{ kameraer: Kamera[] }>("/api/kameraer");
  const { data: hyller } = useHent<{ hyller: HylleRad[] }>("/api/hyller");
  // Alle hyllene dere har laget kan få et kamera, med navnet dere ga dem. Gang-sonen er ingen hylle.
  const kamerahyller = (hyller?.hyller ?? []).filter((h) => h.sone?.type !== "gang");

  return (
    <Skjerm tittel="Kameraer" fane="index">
      <Txt style={{ color: F.dempet }}>
        En gammel telefon på stativ kan følge med på en hylle. Den tar bilde med jevne mellomrom, teller selv og lagrer endringer i loggen.
      </Txt>
      {feil && <Feilboks melding={feil} igjen={last} />}
      {!data && !feil && <Laster />}
      {data?.kameraer.map((k) => (
        <Kort key={k.id} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 12 }}>
          <View style={st.miniatyr}>
            {k.sisteBilde ? <Image source={{ uri: k.sisteBilde }} style={StyleSheet.absoluteFill} /> : <Ikon navn="kamera" size={22} farge={F.hvit} />}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt style={{ fontFamily: S.tekstHalvfet }}>{k.navn}</Txt>
            <Txt style={{ fontSize: 13, color: F.dempet }}>
              Hylle {k.hylle} · sist sett {sistTalt(k.sistSett) === klokke(k.sistSett) ? klokke(k.sistSett) : sistTalt(k.sistSett).toLowerCase()}
            </Txt>
            <Mono style={{ color: F.dempet }}>
              {k.bilderIdag} bilder i dag{k.batteri !== undefined ? ` · ${k.batteri} %` : ""}{k.lader ? " · lader" : ""}
            </Mono>
          </View>
          <Chip status={k.aktiv ? "aktiv" : "offline"} />
        </Kort>
      ))}

      {kamerahyller.length > 0 && <Etikett style={{ marginTop: 10 }}>Kamera på hyllene</Etikett>}
      {kamerahyller.map((h) => (
        <Kort key={h.id} style={{ flexDirection: "row", gap: 8, alignItems: "center", padding: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }}>{h.navn || h.id}</Txt>
            {h.navn && h.navn !== h.id ? <Mono style={{ color: F.dempet }}>{h.id}</Mono> : null}
            <Txt style={{ color: F.dempet }}>Leter etter: {h.innhold.length ? h.innhold.map((i) => i.navn).join(", ") : "alle varene (ingen valgt for hylla)"}</Txt>
          </View>
          <Pressable
            accessibilityLabel={`Bruk denne telefonen som kamera på ${h.navn || h.id}`}
            hitSlop={10}
            onPress={() => router.push({ pathname: "/kamera/[hylle]", params: { hylle: h.id, tak: "1", navn: h.navn || h.id } })}
            style={st.innstilling}
          >
            <Ikon navn="kamera" size={22} />
          </Pressable>
          <Pressable
            accessibilityLabel={`Velg varer for ${h.navn || h.id}`}
            hitSlop={10}
            onPress={() => router.push({ pathname: "/sone/[id]", params: { id: h.id } })}
            style={st.innstilling}
          >
            <Ikon navn="tannhjul" size={22} />
          </Pressable>
        </Kort>
      ))}

      {hyller && hyller.hyller.length === 0 && (
        <Kort style={{ gap: 8 }}>
          <Txt>Du har ingen hyller ennå. Lag en hylle og legg inn varene, så kan telefonen følge med på den.</Txt>
          <LenkeKnapp tekst="Lag en hylle" onPress={() => router.push("/ny-hylle")} />
        </Kort>
      )}
    </Skjerm>
  );
}

const st = lagStil(() => ({
  miniatyr: { width: 56, height: 56, borderRadius: 8, backgroundColor: F.skifer, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  innstilling: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: F.kant, backgroundColor: F.kort, alignItems: "center", justifyContent: "center" },
}));
