import { Image, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { VareDetalj } from "@/lib/typer";
import { useHent } from "@/lib/useHent";
import { F, S } from "@/lib/tema";
import { kortDato, ukedag, erIdag, stor } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { LoggRad } from "@/components/LoggRad";
import { Chip, Display, Feilboks, Kort, LenkeKnapp, Laster, Mono, Rad, Seksjon, Skjerm, Txt } from "@/components/ui";

export default function Vare() {
  const { sku } = useLocalSearchParams<{ sku: string }>();
  const { data: v, feil, last } = useHent<VareDetalj>(`/api/varer/${encodeURIComponent(sku)}`);

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
