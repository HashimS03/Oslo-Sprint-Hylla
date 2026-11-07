import { useState } from "react";
import { Alert, Image, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { Avvik as AvvikData } from "@/lib/typer";
import { send } from "@/lib/api";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { klokke, smaa, stor } from "@/lib/format";
import { HylleTegning } from "@/components/HylleTegning";
import { Chip, Display, Etikett, Feilboks, Kort, Knapp, Laster, LenkeKnapp, Mono, Rad, Skjerm, Txt } from "@/components/ui";

export default function Avvik() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: a, feil, last } = useHent<AvvikData>(`/api/avvik/${id}`);
  const [jobber, setJobber] = useState<string | null>(null);

  const lukk = async (handling: "funnet" | "svinn" | "salg") => {
    setJobber(handling);
    try {
      await send(`/api/avvik/${id}`, { handling });
      await last();
    } catch (e) {
      Alert.alert("Kunne ikke lagre", e instanceof Error ? e.message : "");
    } finally {
      setJobber(null);
    }
  };

  const apen = a?.status === "apen";
  const n = a ? Math.abs(a.endring) : 0;

  return (
    <Skjerm
      tittel="Avvik"
      fane="logg"
      bunn={
        a && apen ? (
          <>
            <Knapp tekst="Tell på nytt" ikon="kamera" onPress={() => router.push({ pathname: "/tell/[hylle]", params: { hylle: a.hylle } })} />
            <Knapp tekst="Det var et salg" variant="mork" laster={jobber === "salg"} onPress={() => lukk("salg")} />
            <Knapp tekst="Marker funnet" variant="hvit" laster={jobber === "funnet"} onPress={() => lukk("funnet")} />
            <View style={{ alignItems: "center", paddingVertical: 4 }}>
              <LenkeKnapp
                tekst={jobber === "svinn" ? "Registrerer …" : "Registrer som svinn"}
                style={{ fontSize: 14, color: F.dempet }}
                onPress={() => Alert.alert("Registrer svinn?", `${n} ${smaa(a.navn)} føres som svinn i loggen.`, [{ text: "Avbryt", style: "cancel" }, { text: "Registrer", style: "destructive", onPress: () => lukk("svinn") }])}
              />
            </View>
          </>
        ) : undefined
      }
    >
      {feil && <Feilboks melding={feil} igjen={last} />}
      {!a && !feil && <Laster />}
      {a && (
        <>
          <Rad>
            <Chip status={apen ? "mulig_svinn" : a.status === "funnet" ? "funnet" : a.status === "lukket" ? "ok" : "svinn"} tekst={a.status === "lukket" ? "SALG" : undefined} />
            {!apen && a.lukketTid && <Mono style={{ color: F.dempet }}>lukket {klokke(a.lukketTid)}</Mono>}
          </Rad>
          <Display style={{ fontSize: 28, lineHeight: 31 }}>{n} × {smaa(a.navn)} {apen ? "mangler" : a.status === "funnet" ? "ble funnet" : a.status === "lukket" ? "ble solgt" : "er registrert som svinn"}</Display>
          <View>
            <Txt style={{ color: F.dempet }}>Hylle {a.hylle}{a.nivaa ? ` · ${a.nivaa}` : ""}</Txt>
            {a.for && a.etter && <Txt style={{ color: F.dempet }}>Mellom {klokke(a.for.tid)} og {klokke(a.etter.tid)}</Txt>}
          </View>

          <Rad gap={10} style={{ alignItems: "stretch" }}>
            {[{ e: "Før", t: a.for }, { e: "Etter", t: a.etter }].map(({ e, t }) => (
              <View key={e} style={{ flex: 1, borderWidth: 1, borderColor: F.kant, borderRadius: 8, overflow: "hidden", backgroundColor: F.hvit }}>
                <View style={{ height: 110, backgroundColor: F.skifer }}>
                  {t?.bilde ? <Image source={{ uri: t.bilde }} style={{ width: "100%", height: "100%" }} /> : <HylleTegning hylle={a.hylle} hoyde={110} />}
                </View>
                <View style={{ padding: 8 }}>
                  <Etikett>{`${e} · ${t ? klokke(t.tid) : "–"}`}</Etikett>
                  <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 14 }}>{t?.antall ?? "–"} stk</Txt>
                </View>
              </View>
            ))}
          </Rad>

          <Kort style={{ gap: 6 }}>
            <Txt style={{ fontFamily: S.tekstHalvfet }}>Hvorfor Hylla flagget dette</Txt>
            <Txt style={{ color: F.dempet, fontSize: 14 }}>{stor(a.aarsak || "Ingen plukkordre eller retur i tidsrommet.")}</Txt>
            <Txt style={{ color: F.dempet, fontSize: 14 }}>
              {a.apneOrdrer > 0 ? `${a.apneOrdrer} registrerte salg for varen, men ingen som dekker nedgangen.` : "Ingen registrerte salg for varen. Registrer salg på varesiden før varene tas, så skiller Hylla salg fra svinn."}
            </Txt>
            {a.etter && <Mono style={{ color: F.dempet, marginTop: 4 }}>talt av {a.etter.teller} · {a.etter.kilde}</Mono>}
          </Kort>
        </>
      )}
    </Skjerm>
  );
}
