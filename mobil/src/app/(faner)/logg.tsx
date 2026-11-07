import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { LoggRad as Rad } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { dagNokkel, dagTittel, datoLang, erIdag } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { LoggRad } from "@/components/LoggRad";
import { Etikett, Feilboks, Laster, Rad as Linje, Skjerm, Txt } from "@/components/ui";

const FILTER = [
  { navn: "Alle", type: "" },
  { navn: "Mottak", type: "mottak" },
  { navn: "Plukk", type: "plukk" },
  { navn: "Svinn", type: "mulig_svinn" },
];

export default function Logg() {
  const { lagret } = useLocalSearchParams<{ lagret?: string }>();
  const [filter, setFilter] = useState("");
  useEffect(() => {
    if (!lagret) return;
    const t = setTimeout(() => router.setParams({ lagret: undefined }), 6000);
    return () => clearTimeout(t);
  }, [lagret]);
  const { data, feil, last } = useHent<{ rader: Rad[]; apneAvvik: number }>(`/api/logg${filter ? `?type=${filter}` : ""}`, { hvert: 3000 });

  const dager = new Map<string, Rad[]>();
  for (const r of data?.rader ?? []) {
    const k = dagNokkel(r.tid);
    dager.set(k, [...(dager.get(k) ?? []), r]);
  }

  return (
    <Skjerm tittel="Logg" tilbake={false}>
      {lagret && (
        <Linje style={st.lagret}>
          <Ikon navn="hake" size={18} farge={F.gronn} tykk={2.6} />
          <Txt style={{ color: F.gronn, fontFamily: S.tekstHalvfet }}>Tellingen av {lagret} er lagret i loggen.</Txt>
        </Linje>
      )}
      <Linje>
        {FILTER.map((f) => {
          const aktiv = f.type === filter;
          return (
            <Pressable key={f.navn} onPress={() => setFilter(f.type)} style={[st.filter, aktiv && { backgroundColor: F.tekst, borderColor: F.tekst }]}>
              <Txt style={{ fontSize: 14, color: aktiv ? F.hvit : F.tekst }}>{f.navn}{f.type === "mulig_svinn" && data?.apneAvvik ? ` · ${data.apneAvvik}` : ""}</Txt>
            </Pressable>
          );
        })}
      </Linje>
      {feil && <Feilboks melding={feil} igjen={last} />}
      {!data && !feil && <Laster />}
      {[...dager].map(([dag, rader]) => (
        <View key={dag} style={{ gap: 8 }}>
          <Etikett style={{ marginTop: 6 }}>{erIdag(rader[0].tid) ? `I dag · ${datoLang(rader[0].tid)}` : dagTittel(rader[0].tid)}</Etikett>
          {rader.map((r) => <LoggRad key={r.id} r={r} />)}
        </View>
      ))}
      {data && data.rader.length === 0 && <Txt style={{ color: F.dempet }}>Ingen hendelser her ennå.</Txt>}
    </Skjerm>
  );
}

const st = StyleSheet.create({
  filter: { borderWidth: 1, borderColor: F.kant, backgroundColor: F.hvit, borderRadius: 20, paddingHorizontal: 14, height: 38, justifyContent: "center" },
  lagret: { backgroundColor: F.gronnlys, borderRadius: 10, padding: 12 },
});
