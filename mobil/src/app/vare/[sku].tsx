import { useState } from "react";
import { Alert, Pressable, Image, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { VareDetalj } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { send } from "@/lib/api";
import { F, S } from "@/lib/tema";
import { kortDato, ukedag, erIdag, stor } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { LoggRad } from "@/components/LoggRad";
import { Chip, Display, Feilboks, Knapp, Kort, LenkeKnapp, Laster, Mono, Rad, Seksjon, Skjerm, Txt } from "@/components/ui";

export default function Vare() {
  const { sku } = useLocalSearchParams<{ sku: string }>();
  const { data: v, feil, last } = useHent<VareDetalj>(`/api/varer/${encodeURIComponent(sku)}`, { hvert: 3000 });
  const [solgt, setSolgt] = useState(1);
  const [lagrer, setLagrer] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);

  const lagrePrompt = async () => {
    if (prompt === null) return;
    try {
      await send(`/api/varer/${encodeURIComponent(sku)}`, { prompt });
      setPrompt(null);
      await last();
    } catch (e) {
      Alert.alert("Kunne ikke lagre", e instanceof Error ? e.message : "");
    }
  };

  const registrerSalg = async () => {
    setLagrer(true);
    try {
      await send("/api/ordrer", { sku, antall: solgt });
      setSolgt(1);
      await last();
    } catch (e) {
      Alert.alert("Kunne ikke registrere salget", e instanceof Error ? e.message : "");
    } finally {
      setLagrer(false);
    }
  };

  return (
    <Skjerm tittel="Vare" fane="varer">
      {feil && <Feilboks melding={feil} igjen={last} />}
      {!v && !feil && <Laster />}
      {v && (
        <>
          <View style={{ height: 130, backgroundColor: "#E6EAE8", borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {v.bilde ? <Image source={{ uri: v.bilde }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : <Ikon navn="skjorte" size={96} farge={v.swatch} />}
          </View>
          <View style={{ gap: 4 }}>
            <Mono style={{ color: F.dempet }}>{v.sku}</Mono>
            <Display style={{ fontSize: 26 }}>{v.navn}</Display>
            <Txt style={{ color: F.dempet }}>{v.leverandor ? `Leverandør: ${v.leverandor}` : "Leverandør ikke oppgitt"}</Txt>
          </View>

          <Kort style={{ gap: 8 }}>
            <Txt>På lager nå</Txt>
            <Rad style={{ justifyContent: "space-between" }}>
              <Display style={{ fontSize: 64, letterSpacing: -2, lineHeight: 70 }}>{v.antall}</Display>
              <Rad gap={6}>{v.perHylle.map((h) => <Chip key={h.hylle} status="hylle" tekst={`HYLLE ${h.hylle}`} />)}</Rad>
            </Rad>
            {v.perHylle.map((h) => (
              <Rad key={h.hylle} style={{ justifyContent: "space-between" }}>
                <Txt style={{ color: F.dempet, fontSize: 14 }}>{h.hylle}{h.nivaa ? ` · ${h.nivaa}` : ""}</Txt>
                <Txt style={{ fontFamily: S.tekstHalvfet }}>{h.antall} stk</Txt>
              </Rad>
            ))}
          </Kort>

          <Kort style={{ gap: 8 }}>
            <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }}>Kameraet leter etter</Txt>
            <Txt style={{ color: F.dempet, fontSize: 14 }}>
              {v.egenPrompt ? "Din egen beskrivelse." : "Laget automatisk av navnet."} Skriv på engelsk, og få med det som skiller den fra andre ting på hylla, f.eks. «clear plastic bottle with blue cap».
            </Txt>
            <Rad gap={8}>
              <TextInput
                value={prompt ?? v.prompt}
                onChangeText={setPrompt}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={lagrePrompt}
                style={{ flex: 1, height: 46, borderWidth: 1, borderColor: F.kant, borderRadius: 10, backgroundColor: F.hvit, paddingHorizontal: 12, fontFamily: S.mono, fontSize: 15, color: F.tekst }}
              />
              {prompt !== null && prompt !== v.prompt && <LenkeKnapp tekst="Lagre" onPress={lagrePrompt} />}
            </Rad>
          </Kort>

          <Kort style={{ gap: 10 }}>
            <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }}>Registrer salg</Txt>
            <Txt style={{ color: F.dempet, fontSize: 14 }}>
              Når du selger varer, registrer dem her før de tas fra hylla. Da ser Hylla at de er solgt og ikke svinn.
            </Txt>
            {v.apneSalg > 0 && <Txt style={{ fontSize: 14 }}>{v.apneSalg} solgt, venter på at kameraet ser at de er tatt.</Txt>}
            <Rad gap={12}>
              <Rad gap={0} style={{ borderWidth: 1, borderColor: F.kant, borderRadius: 10, backgroundColor: F.hvit }}>
                <Pressable accessibilityLabel="Færre" onPress={() => setSolgt((n) => Math.max(1, n - 1))} style={{ width: 44, height: 48, alignItems: "center", justifyContent: "center" }}>
                  <Txt style={{ fontSize: 22 }}>−</Txt>
                </Pressable>
                <Display style={{ fontSize: 22, minWidth: 32, textAlign: "center" }}>{solgt}</Display>
                <Pressable accessibilityLabel="Flere" onPress={() => setSolgt((n) => n + 1)} style={{ width: 44, height: 48, alignItems: "center", justifyContent: "center" }}>
                  <Txt style={{ fontSize: 22 }}>+</Txt>
                </Pressable>
              </Rad>
              <View style={{ flex: 1 }}>
                <Knapp tekst={lagrer ? "Lagrer …" : "Solgt"} variant="mork" laster={lagrer} onPress={registrerSalg} />
              </View>
            </Rad>
          </Kort>

          {v.innkjop && (
            <Kort style={{ gap: 8 }}>
              <Rad style={{ justifyContent: "space-between" }}>
                <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }}>{v.innkjop.id}</Txt>
                <Chip status={v.innkjop.mottatt >= v.innkjop.bestilt ? "mottatt" : "restordre"} />
              </Rad>
              <Txt style={{ color: F.dempet, fontSize: 14 }}>{v.innkjop.bestilt} bestilt {kortDato(v.innkjop.bestiltDato)}</Txt>
              <View style={{ height: 6, backgroundColor: F.graa, borderRadius: 3, marginVertical: 6 }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: F.gronn, width: `${Math.min(100, (v.innkjop.mottatt / v.innkjop.bestilt) * 100)}%` }} />
              </View>
              <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 14 }}>{v.innkjop.mottatt} av {v.innkjop.bestilt} mottatt · {v.innkjop.plukket} plukket siden</Txt>
              {v.innkjop.mottak.length > 0 && (
                <Txt style={{ color: F.dempet, fontSize: 14 }}>
                  {v.innkjop.mottak.map((m) => `${m.antall} ${erIdag(m.tid) ? "i dag" : ukedag(m.tid)}`).join(" · ")}
                </Txt>
              )}
            </Kort>
          )}

          <Seksjon tittel="Historikk" hoyre={<LenkeKnapp tekst="Se logg" onPress={() => router.navigate("/logg")} />}>
            {v.historikk.map((r) => <LoggRad key={r.id} r={r} />)}
          </Seksjon>
          <Txt style={{ color: F.dempet, fontSize: 13 }}>{stor(v.farge)} · størrelse {v.storrelse}</Txt>
        </>
      )}
    </Skjerm>
  );
}
