import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import type { HylleRad, Kamera } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { klokke, sistTalt } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { Chip, Etikett, Feilboks, Kort, Knapp, LenkeKnapp, Laster, Mono, Rad, Skjerm, Txt } from "@/components/ui";

export default function Kameraer() {
  const { data, feil, last } = useHent<{ kameraer: Kamera[] }>("/api/kameraer");
  const { data: hyller } = useHent<{ hyller: HylleRad[] }>("/api/hyller");
  const [hylle, setHylle] = useState<string | null>(null);

  return (
    <Skjerm
      tittel="Kameraer"
      fane="index"
      bunn={<Knapp tekst={hylle ? `Start kamera på ${hylle}` : "Velg en hylle først"} ikon="telefon" deaktivert={!hylle} onPress={() => hylle && router.push({ pathname: "/kamera/[hylle]", params: { hylle } })} />}
    >
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

      <Etikett style={{ marginTop: 10 }}>Bruk denne telefonen som kamera</Etikett>
      <Rad gap={8} style={{ flexWrap: "wrap" }}>
        {(hyller?.hyller ?? []).map((h) => (
          <Pressable key={h.id} onPress={() => setHylle(h.id)} style={[st.valg, hylle === h.id && { backgroundColor: F.tekst, borderColor: F.tekst }]}>
            <Txt style={{ fontFamily: S.tekstHalvfet, color: hylle === h.id ? F.hvit : F.tekst }}>{h.id}</Txt>
          </Pressable>
        ))}
      </Rad>
      {hyller && hyller.hyller.length === 0 && (
        <Kort style={{ gap: 8 }}>
          <Txt>Du har ingen hyller ennå. Lag en hylle og legg inn varene, så kan telefonen følge med på den.</Txt>
          <LenkeKnapp tekst="Lag en hylle" onPress={() => router.push("/ny-hylle")} />
        </Kort>
      )}
    </Skjerm>
  );
}

const st = StyleSheet.create({
  miniatyr: { width: 56, height: 56, borderRadius: 8, backgroundColor: F.skifer, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  valg: { borderWidth: 1.5, borderColor: F.tekst, backgroundColor: F.hvit, borderRadius: 8, width: 56, height: 44, alignItems: "center", justifyContent: "center" },
});
