import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import type { LoggRad as Rad } from "@/lib/typer";
import { F, S } from "@/lib/tema";
import { fortegn, klokke, TYPE_NAVN } from "@/lib/format";
import { Display, Mono, Txt } from "./ui";

export function underTekst(r: Rad): string {
  if (r.type === "mulig_svinn") return `${r.hylle} · ${r.aarsak || "Mulig svinn"}`;
  if (r.type === "mottak") return `${r.hylle} · ${r.ref ? `Restlevering ${r.ref}` : r.aarsak}`;
  if (r.type === "plukk") return `${r.hylle} · Plukk${r.ref ? ` ${r.ref}` : ""}`;
  return `${r.hylle} · ${r.aarsak || TYPE_NAVN[r.type]}`;
}

/** Én linje i lagerloggen, med farget kant: rød for svinn, grønn for økning. */
export function LoggRad({ r, visTid = true }: { r: Rad; visTid?: boolean }) {
  const svinn = r.type === "mulig_svinn" || r.type === "svinn";
  const apen = svinn && r.avvikStatus === "apen";
  const farge = svinn ? F.rod : r.endring > 0 ? F.gronn : F.tekst;
  const kant = svinn ? F.rod : r.endring > 0 ? F.gronn : F.kant;
  return (
    <Pressable
      disabled={!svinn}
      onPress={() => router.push({ pathname: "/avvik/[id]", params: { id: r.id } })}
      style={({ pressed }) => [st.rad, { borderLeftColor: kant, backgroundColor: apen ? F.rodlys : F.hvit }, pressed && { opacity: 0.7 }]}
    >
      {visTid && <Mono style={st.tid}>{klokke(r.tid)}</Mono>}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt style={st.navn} numberOfLines={1}>{r.navn}</Txt>
        <Txt style={st.under} numberOfLines={1}>{underTekst(r)}{apen ? " · åpent" : r.avvikStatus && svinn ? ` · ${r.avvikStatus}` : ""}</Txt>
      </View>
      <Display style={[st.tall, { color: farge }]}>{fortegn(r.endring)}</Display>
    </Pressable>
  );
}

const st = StyleSheet.create({
  rad: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 14,
    borderLeftWidth: 4, borderRadius: 6, borderWidth: 1, borderColor: F.kant,
  },
  tid: { color: F.dempet, width: 40 },
  navn: { fontFamily: S.tekstHalvfet, fontSize: 15 },
  under: { fontSize: 13, color: F.dempet },
  tall: { fontSize: 22, letterSpacing: -0.3 },
});
