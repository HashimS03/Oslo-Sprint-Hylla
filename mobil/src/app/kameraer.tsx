import { Image, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import type { HylleRad, Kamera } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { klokke, sistTalt } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { send } from "@/lib/api";
import { Chip, Etikett, Feilboks, Kort, Knapp, LenkeKnapp, Laster, Mono, Skjerm, Txt } from "@/components/ui";

export default function Kameraer() {
  const { data, feil, last } = useHent<{ kameraer: Kamera[] }>("/api/kameraer");
  const { data: hyller, last: oppdaterHyller } = useHent<{ hyller: HylleRad[] }>("/api/hyller");

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

      {hyller && !hyller.hyller.some((h) => h.sone) && (
        <Kort style={{ gap: 8 }}>
          <Txt>Takkameraet er ikke satt opp i denne databasen ennå.</Txt>
          <Knapp tekst="Sett opp takkamera (T1 Red Bull, T2 Cola)" onPress={async () => { await send("/api/kamera/oppsett", {}).catch(() => undefined); oppdaterHyller(); }} />
        </Kort>
      )}
      {(hyller?.hyller ?? []).some((h) => h.sone && h.sone.type !== "gang") && <Etikett style={{ marginTop: 10 }}>Kamera i taket</Etikett>}
      {(hyller?.hyller ?? []).filter((h) => h.sone && h.sone.type !== "gang").map((h) => (
        <Kort key={h.id} style={{ flexDirection: "row", gap: 8, alignItems: "center", padding: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }}>{h.id} kamera</Txt>
            <Txt style={{ color: F.dempet }}>Leter etter: {h.innhold.length ? h.innhold.map((i) => i.navn).join(", ") : "ingenting valgt"}</Txt>
          </View>
          <Pressable
            accessibilityLabel={`Bruk denne telefonen som kamera på ${h.id}`}
            hitSlop={10}
            onPress={() => router.push({ pathname: "/kamera/[hylle]", params: { hylle: h.id, tak: "1" } })}
            style={st.innstilling}
          >
            <Ikon navn="kamera" size={22} />
          </Pressable>
          <Pressable
            accessibilityLabel={`Innstillinger for ${h.id}`}
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

const st = StyleSheet.create({
  miniatyr: { width: 56, height: 56, borderRadius: 8, backgroundColor: F.skifer, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  innstilling: { width: 44, height: 44, borderRadius: 8, borderWidth: 1.5, borderColor: F.tekst, backgroundColor: F.hvit, alignItems: "center", justifyContent: "center" },
});
