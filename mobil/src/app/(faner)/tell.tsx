import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import type { HylleRad } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { sistTalt } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { Chip, Etikett, Feilboks, HylleFlis, Laster, Rad, Skjerm, Txt } from "@/components/ui";

export default function VelgHylle() {
  const { data, feil, last } = useHent<{ hyller: HylleRad[] }>("/api/hyller");
  const [sok, setSok] = useState("");

  const hyller = useMemo(() => {
    const q = sok.trim().toLowerCase();
    const alle = data?.hyller ?? [];
    if (!q) return alle;
    return alle.filter((h) => h.id.toLowerCase().includes(q) || h.navn.toLowerCase().includes(q) || h.innhold.some((i) => i.navn.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)));
  }, [data, sok]);

  const reoler = [...new Set(hyller.map((h) => h.reol))].sort();
  const avvik = (data?.hyller ?? []).filter((h) => h.status === "avvik");
  const velg = (id: string) => router.push({ pathname: "/tell/[hylle]", params: { hylle: id } });

  return (
    <Skjerm tittel="Velg hylle">
      <Rad style={st.sok}>
        <Ikon navn="sok" size={20} farge={F.dempet} />
        <TextInput
          value={sok}
          onChangeText={setSok}
          placeholder="Søk etter hylle eller vare"
          placeholderTextColor={F.dempet}
          autoCapitalize="characters"
          style={st.sokFelt}
          returnKeyType="go"
          onSubmitEditing={() => hyller.length === 1 && velg(hyller[0].id)}
        />
      </Rad>

      {avvik.length > 0 && (
        <Pressable onPress={() => velg(avvik[0].id)} style={st.varsel}>
          <Ikon navn="advarsel" size={22} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14 }}>{avvik.map((h) => h.id).join(" og ")} har et åpent avvik.</Txt>
            <Txt style={{ fontSize: 14, fontFamily: S.tekstHalvfet }}>Tell {avvik.length === 1 ? "den" : "dem"} først.</Txt>
          </View>
        </Pressable>
      )}

      {feil && <Feilboks melding={feil} igjen={last} />}
      {!data && !feil && <Laster />}

      {reoler.map((reol) => (
        <View key={reol} style={{ gap: 10 }}>
          <Etikett style={{ marginTop: 6 }}>{`Reol ${reol}`}</Etikett>
          {hyller
            .filter((h) => h.reol === reol)
            .sort((a, b) => (a.status === "avvik" ? -1 : b.status === "avvik" ? 1 : a.id.localeCompare(b.id)))
            .map((h) => (
              <Pressable key={h.id} onPress={() => velg(h.id)} style={({ pressed }) => [st.hylle, pressed && { opacity: 0.7 }]}>
                <HylleFlis id={h.id} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }} numberOfLines={1}>{kortNavn(h)}</Txt>
                  <Txt style={{ fontSize: 14, color: F.dempet }}>Sist talt: {h.sistTalt ? sistTalt(h.sistTalt) : "Ikke talt i dag"}</Txt>
                </View>
                <Chip status={h.status} />
              </Pressable>
            ))}
        </View>
      ))}
      {data && hyller.length === 0 && <Txt style={{ color: F.dempet }}>Ingen hyller passer søket.</Txt>}
    </Skjerm>
  );
}

/** «T-skjorter S og L» heller enn «Reol B, hylle 2» når hylla har innhold. */
function kortNavn(h: HylleRad): string {
  if (!h.innhold.length) return h.navn;
  const grupper = new Map<string, string[]>();
  for (const i of h.innhold) {
    let n = i.navn.split(",")[0].replace(/^(svart|hvit|grå|rød|blå|sort)\s+/i, "").trim();
    const m = n.match(/\s(XS|S|M|L|XL|XXL)$/);
    const str = m ? m[1] : "";
    if (m) n = n.slice(0, -m[0].length);
    const liste = grupper.get(n) ?? [];
    if (str && !liste.includes(str)) liste.push(str);
    grupper.set(n, liste);
  }
  const deler = [...grupper].map(([n, str]) => `${flertall(n)}${str.length ? " " + str.join(" og ") : ""}`);
  const t = deler.map((d, i) => (i === 0 ? d : d.toLowerCase())).join(" og ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const flertall = (n: string) => (n.endsWith("er") ? n + "e" : n.endsWith("e") ? n + "r" : n);

const st = StyleSheet.create({
  sok: { height: 52, borderWidth: 1, borderColor: F.kant, backgroundColor: F.hvit, borderRadius: 12, paddingHorizontal: 14, gap: 10 },
  sokFelt: { flex: 1, fontFamily: S.tekst, fontSize: 16, color: F.tekst, height: "100%" },
  varsel: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: F.gullys, borderRadius: 12, padding: 14 },
  hylle: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: F.hvit, borderWidth: 1.5, borderColor: F.tekst, borderRadius: 12, padding: 12 },
});
