import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { HylleRad } from "@/lib/typer";
import { patch } from "@/lib/api";
import { useHent } from "@/lib/useHent";
import { F, S, lagStil } from "@/lib/tema";
import { Etikett, Feilboks, Knapp, Laster, Skjerm, Txt } from "@/components/ui";

// Innstillinger for kameraet på én hylle: hvilke varer det skal lete etter. En eller flere.
// Standard er varene som er registrert på hylla.
export default function SoneInnstillinger() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: hyller, feil, last } = useHent<{ hyller: HylleRad[] }>("/api/hyller");
  const { data: varer } = useHent<{ varer: { sku: string; navn: string }[] }>("/api/varer");
  const hylle = hyller?.hyller.find((h) => h.id === id);
  const [valgt, setValgt] = useState<string[] | null>(null);
  const [lagrer, setLagrer] = useState(false);
  const [lagreFeil, setLagreFeil] = useState<string | null>(null);

  useEffect(() => {
    if (hylle && valgt === null) setValgt(hylle.innhold.map((i) => i.sku));
  }, [hylle, valgt]);

  async function lagre() {
    if (!valgt?.length) return;
    setLagrer(true);
    setLagreFeil(null);
    try {
      await patch(`/api/hyller/${id}`, { skuer: valgt });
      router.back();
    } catch (e) {
      setLagreFeil(e instanceof Error ? e.message : "Kunne ikke lagre");
      setLagrer(false);
    }
  }

  return (
    <Skjerm tittel={hylle?.navn || id} bunn={<Knapp tekst={lagrer ? "Lagrer …" : `Lagre (${valgt?.length ?? 0} valgt)`} laster={lagrer} deaktivert={!valgt?.length} onPress={lagre} />}>
      {feil && <Feilboks melding={feil} igjen={last} />}
      {!hyller && !feil && <Laster />}
      <Etikett>Leter etter</Etikett>
      <Txt style={{ color: F.dempet }}>Velg én eller flere varer. Kameraet teller alle varene du velger på denne hylla.</Txt>
      {(varer?.varer ?? []).map((v) => {
        const er = !!valgt?.includes(v.sku);
        return (
          <Pressable key={v.sku} onPress={() => setValgt((l) => (l ?? []).includes(v.sku) ? (l ?? []).filter((x) => x !== v.sku) : [...(l ?? []), v.sku])} style={[st.rad, er && { backgroundColor: F.gullys, borderColor: F.gul }]}>
            <View style={[st.boks, er && { backgroundColor: F.tekst }]} />
            <Txt style={{ fontFamily: S.tekstHalvfet }}>{v.navn}</Txt>
          </Pressable>
        );
      })}
      {lagreFeil && <Txt style={{ color: F.rod }}>{lagreFeil}</Txt>}
    </Skjerm>
  );
}

const st = lagStil(() => ({
  rad: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: F.kant, backgroundColor: F.kort, borderRadius: 10, paddingHorizontal: 14, height: 52 },
  boks: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: F.tekst },
}));
