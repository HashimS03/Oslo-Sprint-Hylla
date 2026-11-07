import { Image, Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { SkannVare } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { Ikon } from "@/components/Ikon";
import { Display, Etikett, Feilboks, HylleFlis, Knapp, Kort, Laster, Mono, Rad, Seksjon, Skjerm, Txt } from "@/components/ui";

/** Varekortet: det samme enten varen ble scannet eller valgt fra lista. Viser ikke avvik. */
export default function Vare() {
  const { sku } = useLocalSearchParams<{ sku: string }>();
  const { data, feil, last } = useHent<{ vare: SkannVare }>(`/api/skann/${encodeURIComponent(sku ?? "")}`);
  const v = data?.vare;

  return (
    <Skjerm
      tittel="Vare"
      bunn={v && (
        <Knapp
          tekst="Meld avvik"
          undertekst="Mangler, skadet eller feil plass"
          ikon="advarsel"
          onPress={() => router.push({ pathname: "/meld-avvik", params: { sku: v.sku } })}
        />
      )}
    >
      {feil && !v && <Feilboks melding={feil} igjen={last} />}
      {!v && !feil && <Laster />}
      {v && (
        <>
          <View style={[st.bilde, { backgroundColor: v.swatch + "33" }]}>
            {v.bilde ? (
              <Image source={{ uri: v.bilde }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[st.swatch, { backgroundColor: v.swatch }]} />
            )}
          </View>

          <View style={{ gap: 4 }}>
            <Mono style={{ color: F.dempet, fontSize: 13 }}>{v.sku}</Mono>
            <Display style={{ fontSize: 30 }}>{v.navn}</Display>
            <Txt style={{ color: F.dempet, fontSize: 16 }}>{[v.farge, v.storrelse].filter(Boolean).join(" · ")}</Txt>
          </View>

          <Kort style={st.antall}>
            <View style={{ flex: 1 }}>
              <Etikett>I systemet</Etikett>
              <Txt style={{ color: F.dempet, marginTop: 2 }}>Antall på lager nå</Txt>
            </View>
            <Display style={{ fontSize: 48 }}>{v.antall}</Display>
          </Kort>

          <Seksjon tittel="Hvor står den?">
            {v.hyller.length === 0 && <Txt style={{ color: F.dempet }}>Varen er ikke plassert på noen hylle.</Txt>}
            {v.hyller.map((h) => (
              <Kort key={h.id}>
                <Rad gap={14}>
                  <HylleFlis id={h.id} size={52} />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 16 }}>{h.navn}</Txt>
                    {!!h.nivaa && <Txt style={{ color: F.dempet }}>{h.nivaa}</Txt>}
                  </View>
                  <Display style={{ fontSize: 22 }}>{h.antall}</Display>
                </Rad>
              </Kort>
            ))}
          </Seksjon>

          {v.oppgaver.length > 0 && (
            <Seksjon tittel="Oppgaver for varen">
              {v.oppgaver.map((o) => (
                <Pressable key={o.id} onPress={() => router.push({ pathname: "/oppgave/[id]", params: { id: o.id } })}>
                  <Kort farge={F.gronnlys}>
                    <Rad gap={12}>
                      <Ikon navn="hake" size={22} />
                      <Txt style={{ flex: 1, fontFamily: S.tekstHalvfet, fontSize: 16 }}>{o.tittel}</Txt>
                      <Ikon navn="pil" size={20} />
                    </Rad>
                  </Kort>
                </Pressable>
              ))}
            </Seksjon>
          )}
        </>
      )}
    </Skjerm>
  );
}

const st = StyleSheet.create({
  bilde: { height: 160, borderRadius: 14, borderWidth: 1.5, borderColor: F.tekst, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  swatch: { width: 84, height: 84, borderRadius: 18, borderWidth: 2, borderColor: F.tekst },
  antall: { flexDirection: "row", alignItems: "center" },
});
