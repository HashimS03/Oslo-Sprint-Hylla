import { useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import type { HylleRad } from "@/lib/typer";
import { send } from "@/lib/api";
import { useHent } from "@/lib/useHent";
import { tilJpeg } from "@/lib/bilde";
import { F, S } from "@/lib/tema";
import { Ikon } from "@/components/Ikon";
import { Feilboks, Knapp, Mono, Rad, Skjerm, Txt } from "@/components/ui";

const FARGER = [
  { navn: "svart", hex: "#1E1E20" }, { navn: "hvit", hex: "#E8E6E1" }, { navn: "grå", hex: "#9AA3A6" },
  { navn: "rød", hex: "#B3362A" }, { navn: "blå", hex: "#2F5D8A" }, { navn: "grønn", hex: "#2F7D55" },
  { navn: "gul", hex: "#F4C430" }, { navn: "oransje", hex: "#E07B2A" }, { navn: "brun", hex: "#8A5A3B" },
];
const STORRELSER = ["XS", "S", "M", "L", "XL", "One size"];
const BILDE_HINT = ["Brettet", "Stablet", "Merkelapp"];

export default function NyVare() {
  const { data } = useHent<{ hyller: HylleRad[] }>("/api/hyller");
  const param = useLocalSearchParams<{ hylle?: string }>();
  const [bilder, setBilder] = useState<string[]>([]);
  const [navn, setNavn] = useState("");
  const [sku, setSku] = useState("");
  const [hylle, setHylle] = useState(param.hylle ?? "");
  const [antall, setAntall] = useState("");
  const [prompt, setPrompt] = useState("");
  const [storrelse, setStorrelse] = useState("M");
  const [farge, setFarge] = useState(FARGER[2]);
  const [lagrer, setLagrer] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  const taBilde = async () => {
    const tillatelse = await ImagePicker.requestCameraPermissionsAsync();
    if (!tillatelse.granted) return setFeil("Appen trenger tilgang til kameraet for å ta bilde av varen.");
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    const b = await tilJpeg(res.assets[0].uri, 480, 0.6);
    setBilder((bs) => [...bs, b].slice(0, 3));
  };

  const lagre = async () => {
    setFeil(null);
    if (!navn.trim() || !sku.trim() || !hylle.trim()) return setFeil("Fyll inn navn, SKU og hylle.");
    setLagrer(true);
    try {
      const res = await send<{ sku: string }>("/api/varer", {
        sku, navn, farge: farge.navn, storrelse, swatch: farge.hex, hylle: hylle.trim(), bilder,
        antall: Number(antall) || 0, prompt, beskrivelse: `${navn}, ${farge.navn}, størrelse ${storrelse}`,
      });
      router.replace({ pathname: "/vare/[sku]", params: { sku: res.sku } });
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Kunne ikke lagre");
      setLagrer(false);
    }
  };

  return (
    <Skjerm tittel="Nytt produkt" fane="varer" bunn={<Knapp tekst={lagrer ? "Lagrer …" : "Lagre produkt"} laster={lagrer} onPress={lagre} />}>
      <Rad style={{ justifyContent: "space-between" }}>
        <Txt style={{ fontFamily: S.tekstHalvfet }}>Bilder av varen</Txt>
        <Mono style={{ color: F.dempet }}>{bilder.length} av 3 tatt</Mono>
      </Rad>
      <Txt style={{ color: F.dempet, fontSize: 14, marginTop: -6 }}>Slik kjenner Hylla varen igjen på hylla.</Txt>
      <Rad gap={8}>
        {BILDE_HINT.map((h, i) => (
          <Pressable key={h} onPress={taBilde} disabled={i !== bilder.length} style={[st.bilde, i === bilder.length && { borderStyle: "dashed", borderColor: F.dempet }]}>
            {bilder[i] ? (
              <Image source={{ uri: bilder[i] }} style={StyleSheet.absoluteFill} />
            ) : (
              <>
                <Ikon navn={i === bilder.length ? "kamera" : "skjorte"} size={24} farge={i === bilder.length ? F.tekst : F.kant} />
                <Txt style={{ fontSize: 12, color: F.dempet }}>{i === bilder.length ? "Ta bilde" : h}</Txt>
              </>
            )}
            {bilder[i] && <View style={st.bildeEtikett}><Txt style={{ fontSize: 11, color: F.hvit }}>{h} ✓</Txt></View>}
          </Pressable>
        ))}
      </Rad>

      <Felt etikett="Navn" verdi={navn} endre={setNavn} plassholder="F.eks. Grå hettegenser M" />
      <Felt etikett="SKU" verdi={sku} endre={(t) => setSku(t.toUpperCase())} plassholder="F.eks. HG-GRY-M" store />

      <Txt style={st.etikett}>Hylle</Txt>
      <Rad gap={8} style={{ flexWrap: "wrap" }}>
        {(data?.hyller ?? []).map((h) => <Valg key={h.id} tekst={h.id} aktiv={hylle === h.id} onPress={() => setHylle(h.id)} />)}
      </Rad>
      <TextInput value={hylle} onChangeText={(t) => setHylle(t.toUpperCase())} placeholder={data?.hyller.length ? "Eller skriv en ny, f.eks. T1" : "Skriv hylla, f.eks. T1"} placeholderTextColor={F.dempet} autoCapitalize="characters" style={st.input} />

      <Rad gap={10}>
        <View style={{ flex: 1 }}>
          <Felt etikett="Antall på hylla nå" verdi={antall} endre={(t) => setAntall(t.replace(/\D/g, ""))} plassholder="0" tall />
        </View>
        <View style={{ flex: 1.4 }}>
          <Felt etikett="På engelsk (kamera)" verdi={prompt} endre={setPrompt} plassholder="red soda can" liten />
        </View>
      </Rad>

      <Txt style={st.etikett}>Størrelse</Txt>
      <Rad gap={8} style={{ flexWrap: "wrap" }}>
        {STORRELSER.map((s) => <Valg key={s} tekst={s} aktiv={storrelse === s} onPress={() => setStorrelse(s)} />)}
      </Rad>

      <Txt style={st.etikett}>Farge</Txt>
      <Rad gap={12} style={{ flexWrap: "wrap" }}>
        {FARGER.map((f) => (
          <Pressable key={f.navn} accessibilityLabel={f.navn} onPress={() => setFarge(f)} style={[st.fargeRing, farge === f && { borderColor: F.tekst }]}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: f.hex, borderWidth: 1, borderColor: "#BDBAB4" }} />
          </Pressable>
        ))}
      </Rad>

      {feil && <Feilboks melding={feil} />}
    </Skjerm>
  );
}

function Felt({ etikett, verdi, endre, plassholder, store, tall, liten }: { etikett: string; verdi: string; endre: (t: string) => void; plassholder: string; store?: boolean; tall?: boolean; liten?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt style={st.etikett}>{etikett}</Txt>
      <TextInput value={verdi} onChangeText={endre} placeholder={plassholder} placeholderTextColor={F.dempet} autoCapitalize={store ? "characters" : liten ? "none" : "sentences"} keyboardType={tall ? "number-pad" : "default"} style={st.input} />
    </View>
  );
}

function Valg({ tekst, aktiv, onPress }: { tekst: string; aktiv: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[st.valg, aktiv && { backgroundColor: F.tekst, borderColor: F.tekst }]}>
      <Txt style={{ color: aktiv ? F.bg : F.tekst, fontSize: 14 }}>{tekst}</Txt>
    </Pressable>
  );
}

const st = StyleSheet.create({
  etikett: { fontFamily: S.tekstHalvfet, fontSize: 14, marginTop: 4 },
  input: { height: 48, borderWidth: 1, borderColor: F.kant, borderRadius: 10, backgroundColor: F.kort, paddingHorizontal: 14, fontFamily: S.tekst, fontSize: 16, color: F.tekst },
  bilde: { flex: 1, height: 88, borderRadius: 10, borderWidth: 1, borderColor: F.kant, backgroundColor: F.kort, alignItems: "center", justifyContent: "center", gap: 4, overflow: "hidden" },
  bildeEtikett: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(17,21,23,0.6)", alignItems: "center", paddingVertical: 2 },
  valg: { borderWidth: 1, borderColor: F.kant, backgroundColor: F.kort, borderRadius: 8, paddingHorizontal: 14, height: 40, justifyContent: "center" },
  fargeRing: { padding: 3, borderRadius: 20, borderWidth: 2, borderColor: "transparent" },
});
