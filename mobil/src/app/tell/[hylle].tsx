import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { Forslag, ForslagEndring, HylleDetalj } from "@/lib/typer";
import { send } from "@/lib/api";
import { useHent } from "@/lib/useHent";
import { tilJpeg } from "@/lib/bilde";
import { F, S } from "@/lib/tema";
import { fortegn, klokke, smaa } from "@/lib/format";
import { Ikon } from "@/components/Ikon";
import { StatiskFaner } from "@/components/Faner";
import { HylleTegning } from "@/components/HylleTegning";
import { Chip, Display, Etikett, Feilboks, Kort, Knapp, LenkeKnapp, Mono, Rad, Skjerm, Txt } from "@/components/ui";

type Steg = "kamera" | "analyserer" | "resultat" | "feil";

export default function TellHylle() {
  const { hylle: hylleId } = useLocalSearchParams<{ hylle: string }>();
  const { data: hylle } = useHent<HylleDetalj>(`/api/hyller/${hylleId}`);
  const [steg, setSteg] = useState<Steg>("kamera");
  const [bilde, setBilde] = useState<{ uri: string; liten?: string } | null>(null);
  const [forslag, setForslag] = useState<Forslag | null>(null);
  const [fremdrift, setFremdrift] = useState(0);
  const [feil, setFeil] = useState("");

  const tell = useCallback(
    async (uri: string | null) => {
      setBilde(uri ? { uri } : null);
      setSteg("analyserer");
      setFremdrift(0);
      try {
        let stort: string | undefined;
        let liten: string | undefined;
        if (uri) {
          [stort, liten] = await Promise.all([tilJpeg(uri, 1600, 0.75), tilJpeg(uri, 640, 0.6)]);
          setBilde({ uri, liten });
        }
        setFremdrift(1);
        const { forslag } = await send<{ forslag: Forslag }>("/api/tell", { hylle: hylleId, bilde: stort, demo: !uri });
        setFremdrift(2);
        await new Promise((r) => setTimeout(r, 600));
        setForslag(forslag);
        setSteg("resultat");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch (e) {
        setFeil(e instanceof Error ? e.message : "Tellingen feilet");
        setSteg("feil");
      }
    },
    [hylleId],
  );

  if (steg === "kamera") return <Kamera hylle={hylleId} forrige={hylle?.forrige ?? null} onBilde={tell} />;
  if (steg === "analyserer") return <Analyserer hylle={hylleId} bilde={bilde?.uri ?? null} forrige={hylle?.forrige?.tid ?? null} fremdrift={fremdrift} />;
  if (steg === "feil")
    return (
      <Skjerm tittel="Tellingen gikk ikke" fane="tell" bunn={<><Knapp tekst="Ta nytt bilde" ikon="kamera" onPress={() => setSteg("kamera")} /><Knapp variant="hvit" tekst="Bruk demotelling" onPress={() => tell(null)} /></>}>
        <Etikett>{`Hylle ${hylleId}`}</Etikett>
        <Feilboks melding={feil} />
      </Skjerm>
    );
  return <Resultat hylle={hylleId} forslag={forslag!} liten={bilde?.liten} sporNaarUsikker={hylle?.sporNaarUsikker ?? true} onNyttBilde={() => setSteg("kamera")} />;
}

// ---------------- Kamera ----------------

function Kamera({ hylle, forrige, onBilde }: { hylle: string; forrige: HylleDetalj["forrige"]; onBilde: (uri: string | null) => void }) {
  const inn = useSafeAreaInsets();
  const [tillatelse, spor] = useCameraPermissions();
  const kamera = useRef<CameraView>(null);
  const [klar, setKlar] = useState(false);
  const [lys, setLys] = useState(false);
  const [tar, setTar] = useState(false);

  const taBilde = async () => {
    if (!kamera.current || tar) return;
    setTar(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const b = await kamera.current.takePictureAsync({ quality: 0.8, shutterSound: false });
      onBilde(b.uri);
    } catch {
      setTar(false);
    }
  };

  return (
    <View style={[st.mork, { paddingTop: inn.top }]}>
      <Rad style={st.kameraTopp}>
        <Pressable accessibilityLabel="Lukk" hitSlop={12} onPress={() => router.back()}>
          <Ikon navn="lukk" size={24} farge={F.hvit} />
        </Pressable>
        <View style={st.hylleChip}>
          <Mono style={{ fontSize: 13 }}>Hylle {hylle}</Mono>
        </View>
        <Pressable accessibilityLabel={lys ? "Slå av lykt" : "Slå på lykt"} hitSlop={12} onPress={() => setLys(!lys)}>
          <Ikon navn={lys ? "lykt" : "lyktAv"} size={24} farge={lys ? F.gul : F.hvit} />
        </Pressable>
      </Rad>

      <View style={st.ramme}>
        {tillatelse?.granted ? (
          <CameraView ref={kamera} style={StyleSheet.absoluteFill} facing="back" enableTorch={lys} onCameraReady={() => setKlar(true)} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { justifyContent: "center", padding: 24, gap: 16 }]}>
            <HylleTegning hylle={hylle} />
          </View>
        )}
        {(["tv", "th", "bv", "bh"] as const).map((h) => (
          <View key={h} style={[st.hjorne, h[0] === "t" ? { top: 16 } : { bottom: 16 }, h[1] === "v" ? { left: 16 } : { right: 16 }, {
            borderTopWidth: h[0] === "t" ? 3 : 0, borderBottomWidth: h[0] === "b" ? 3 : 0, borderLeftWidth: h[1] === "v" ? 3 : 0, borderRightWidth: h[1] === "h" ? 3 : 0,
          }]} />
        ))}
        <View style={st.hint}>
          <Txt style={{ color: F.hvit, fontFamily: S.tekstMedium, fontSize: 14 }}>
            {tillatelse?.granted ? "Få med hele hylla, rett forfra" : "Hylla trenger kameraet for å telle"}
          </Txt>
        </View>
      </View>

      <View style={st.kontroller}>
        <View style={st.forrige}>
          {forrige?.bilde ? <Image source={{ uri: forrige.bilde }} style={StyleSheet.absoluteFill} /> : <View style={{ width: 14, height: 10, borderTopWidth: 2, borderBottomWidth: 2, borderColor: F.hvit, opacity: 0.6 }} />}
          <View style={st.forrigeTid}>
            <Mono style={{ color: F.hvit, fontSize: 12 }}>{forrige ? klokke(forrige.tid) : "ny"}</Mono>
          </View>
        </View>
        {tillatelse?.granted ? (
          <Pressable accessibilityLabel="Ta bilde" onPress={taBilde} disabled={!klar || tar} style={({ pressed }) => [st.utloser, pressed && { transform: [{ scale: 0.94 }] }]}>
            <View style={st.utloserInne}>{tar && <ActivityIndicator color={F.tekst} />}</View>
          </Pressable>
        ) : (
          <View style={{ flex: 1, marginHorizontal: 16 }}>
            <Knapp tekst="Gi tilgang til kamera" onPress={spor} />
          </View>
        )}
        <View style={{ width: 64 }} />
      </View>
      <View style={{ alignItems: "center", gap: 10, paddingBottom: 14 }}>
        <Txt style={{ color: F.hvit, fontSize: 16 }}>{tillatelse?.granted ? (klar ? "Klar til telling" : "Starter kameraet …") : " "}</Txt>
        <Pressable hitSlop={8} onPress={() => onBilde(null)}>
          <Txt style={{ color: "#9AA3A6", fontSize: 13, textDecorationLine: "underline" }}>Ingen hylle foran deg? Bruk demotelling</Txt>
        </Pressable>
      </View>
      <StatiskFaner aktiv="tell" />
    </View>
  );
}

// ---------------- Analyserer ----------------

function Analyserer({ hylle, bilde, forrige, fremdrift }: { hylle: string; bilde: string | null; forrige: string | null; fremdrift: number }) {
  const [sek, setSek] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSek((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const steg = [
    { tekst: bilde ? "Bildet er lastet opp" : "Bruker demobilde", under: null },
    { tekst: "Kjenner igjen varer", under: fremdrift >= 1 ? "Teller stabler på hver hylle" : null },
    { tekst: "Sammenligner med lagerloggen", under: forrige ? `Forrige telling kl. ${klokke(forrige)}` : "Første telling av hylla" },
  ];
  return (
    <Skjerm tittel="Analyserer" fane="tell">
      <View style={st.bildeRamme}>
        {bilde ? <Image source={{ uri: bilde }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : <HylleTegning hylle={hylle} hoyde={200} />}
        <View style={st.skanneLinje} />
      </View>
      <Etikett style={{ alignSelf: "flex-end" }}>{`Hylle ${hylle} · ${bilde ? "nytt bilde" : "demo"}`}</Etikett>
      <Display style={{ fontSize: 26 }}>Hylla teller for deg.</Display>
      <View style={{ gap: 14, marginTop: 4 }}>
        {steg.map((s, i) => {
          const status = i < fremdrift ? "ferdig" : i === fremdrift ? "aktiv" : "venter";
          const ok = status === "ferdig";
          return (
            <Rad key={i} gap={12} style={{ alignItems: "flex-start" }}>
              <View style={[st.prikk, ok ? { backgroundColor: F.gronnlys } : status === "aktiv" ? { backgroundColor: F.gullys } : { borderWidth: 1, borderColor: F.kant }]}>
                {ok ? <Ikon navn="hake" size={14} farge={F.gronn} tykk={2.6} /> : status === "aktiv" ? <ActivityIndicator size="small" color={F.tekst} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontFamily: status === "venter" ? S.tekst : S.tekstHalvfet, color: status === "venter" ? F.dempet : F.tekst }}>{s.tekst}</Txt>
                {s.under && <Txt style={{ fontSize: 13, color: F.dempet }}>{s.under}</Txt>}
              </View>
            </Rad>
          );
        })}
      </View>
      <Txt style={{ textAlign: "center", color: F.dempet, fontSize: 13, marginTop: 12 }}>Tar vanligvis 3–8 sekunder · {sek} s</Txt>
    </Skjerm>
  );
}

// ---------------- Resultat ----------------

/** Brukeren valgte et annet tall for en usikker vare: flytt differansen over på svinn/korrigering. */
function justert(e: ForslagEndring, valgt: number | undefined): ForslagEndring {
  if (valgt === undefined || valgt === e.na) return e;
  const delta = valgt - e.na;
  const deler = e.deler.map((d) => ({ ...d }));
  const siste = deler.findLast((d) => d.type === "mulig_svinn" || d.type === "korrigering");
  if (siste) siste.endring += delta;
  else deler.push({ type: delta < 0 ? "mulig_svinn" : "korrigering", endring: delta, aarsak: delta < 0 ? "Ingen plukkordre forklarer dette" : "Flere enn ventet" });
  return { ...e, na: valgt, deler: deler.filter((d) => d.endring !== 0) };
}

function Resultat({ hylle, forslag, liten, sporNaarUsikker, onNyttBilde }: {
  hylle: string; forslag: Forslag; liten?: string; sporNaarUsikker: boolean; onNyttBilde: () => void;
}) {
  const [valg, setValg] = useState<Record<string, number>>({});
  const [lagrer, setLagrer] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const usikre = sporNaarUsikker ? forslag.endringer.filter((e) => e.alternativ !== null && e.sikkerhet < 0.8) : [];
  const endringer = forslag.endringer.map((e) => justert(e, valg[e.sku])).filter((e) => e.deler.length > 0);
  const snitt = forslag.endringer.length ? Math.round((forslag.endringer.reduce((s, e) => s + e.sikkerhet, 0) / forslag.endringer.length) * 100) : 100;

  const lagre = async () => {
    setLagrer(true);
    setFeil(null);
    try {
      await send("/api/tell/lagre", { forslag, korrigert: valg, bilde: liten, kilde: "mobil" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (router.canDismiss()) router.dismissAll();
      router.navigate({ pathname: "/logg", params: { lagret: hylle } });
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Kunne ikke lagre");
      setLagrer(false);
    }
  };

  return (
    <Skjerm
      tittel="Resultat"
      fane="tell"
      bunn={<Knapp tekst={lagrer ? "Lagrer …" : "Lagre i loggen"} laster={lagrer} onPress={lagre} />}
    >
      <Etikett>{`Hylle ${hylle} · ${forslag.forrigeTid ? `sammenlignet med ${klokke(forslag.forrigeTid)}` : "første telling"}`}</Etikett>
      <Display style={{ fontSize: 26, marginTop: -4 }}>
        {endringer.length === 0 ? "Ingen endringer" : `${endringer.length} ${endringer.length === 1 ? "endring" : "endringer"} funnet`}
      </Display>

      {endringer.length === 0 && <Kort><Txt>Hylla stemmer med lagerloggen. Lagre for å registrere at {hylle} er talt.</Txt></Kort>}

      {endringer.map((e) => {
        const sum = e.deler.reduce((s, d) => s + d.endring, 0);
        const hoved = e.deler.find((d) => d.type === "mulig_svinn") ?? e.deler[0];
        return (
          <Kort key={e.sku} style={{ gap: 10 }}>
            <Rad>{[...new Set(e.deler.map((d) => d.type))].map((t) => <Chip key={t} status={t} />)}</Rad>
            <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 17 }}>{e.navn}</Txt>
            <Rad style={{ justifyContent: "space-between" }}>
              <Rad gap={10}>
                <Display style={{ fontSize: 40, color: F.dempet }}>{e.forrige}</Display>
                <Txt style={{ fontSize: 22 }}>→</Txt>
                <Display style={{ fontSize: 40 }}>{e.na}</Display>
              </Rad>
              <View style={[st.delta, { backgroundColor: sum > 0 ? F.gronnlys : F.rodlys }]}>
                <Display style={{ fontSize: 22, color: sum > 0 ? F.gronn : F.rod }}>{fortegn(sum)}</Display>
              </View>
            </Rad>
            {e.deler.length > 1 ? (
              e.deler.map((d, i) => (
                <Rad key={i}>
                  <Txt style={{ flex: 1, fontSize: 14, color: F.dempet }}>{d.aarsak}</Txt>
                  <Mono>{fortegn(d.endring)}</Mono>
                </Rad>
              ))
            ) : (
              <Txt style={{ fontSize: 14, color: F.dempet }}>{hoved.aarsak}</Txt>
            )}
          </Kort>
        );
      })}

      {usikre.map((e) => {
        const [a, b] = [Math.min(e.na, e.alternativ!), Math.max(e.na, e.alternativ!)];
        return (
          <View key={`u-${e.sku}`} style={st.usikker}>
            <Txt style={{ fontFamily: S.tekstHalvfet, fontSize: 14 }}>Usikker på {smaa(e.navn)}</Txt>
            <Txt style={{ fontSize: 14 }}>Ser du {a} eller {b}?</Txt>
            <Rad>
              {[a, b].map((n) => {
                const aktiv = (valg[e.sku] ?? e.na) === n;
                return (
                  <Pressable key={n} onPress={() => setValg({ ...valg, [e.sku]: n })} style={[st.valg, aktiv && { backgroundColor: F.tekst }]}>
                    <Txt style={{ fontFamily: S.tekstHalvfet, color: aktiv ? F.hvit : F.tekst }}>{n}</Txt>
                  </Pressable>
                );
              })}
              <Pressable onPress={onNyttBilde} style={[st.valg, { flex: 1, borderColor: F.kant }]}>
                <Txt style={{ fontSize: 14 }}>Ta nytt bilde</Txt>
              </Pressable>
            </Rad>
          </View>
        );
      })}

      <Rad style={{ justifyContent: "space-between", paddingHorizontal: 2 }}>
        <Txt style={{ fontSize: 13, color: F.dempet }}>Uendret: {forslag.uendret} {forslag.uendret === 1 ? "vare" : "varer"}</Txt>
        <Mono style={{ color: F.dempet }}>{forslag.teller} · {snitt} %</Mono>
      </Rad>
      {forslag.ukjente.length > 0 && <Txt style={{ fontSize: 13, color: F.dempet }}>Ukjente varer på bildet: {forslag.ukjente.join(", ")}</Txt>}
      {feil && <Feilboks melding={feil} />}
      <View style={{ alignItems: "center" }}>
        <LenkeKnapp tekst="Forkast" style={{ color: F.dempet, fontSize: 14 }} onPress={() => router.back()} />
      </View>
    </Skjerm>
  );
}

const st = StyleSheet.create({
  mork: { flex: 1, backgroundColor: F.mork },
  kameraTopp: { justifyContent: "space-between", paddingHorizontal: 20, height: 52 },
  hylleChip: { backgroundColor: "#E8ECEA", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  ramme: { flex: 1, marginHorizontal: 16, marginTop: 8, borderRadius: 14, overflow: "hidden", backgroundColor: F.skifer },
  hjorne: { position: "absolute", width: 28, height: 28, borderColor: F.gul },
  hint: { position: "absolute", bottom: 26, left: 0, right: 0, alignItems: "center" },
  kontroller: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  forrige: { width: 64, height: 52, borderRadius: 8, borderWidth: 1, borderColor: "#4A5357", backgroundColor: "#2B3134", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  forrigeTid: { position: "absolute", bottom: 3, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 4, borderRadius: 3 },
  utloser: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: F.gul, alignItems: "center", justifyContent: "center" },
  utloserInne: { width: 68, height: 68, borderRadius: 34, backgroundColor: F.gul, borderWidth: 2, borderColor: F.mork, alignItems: "center", justifyContent: "center" },
  bildeRamme: { height: 210, borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: F.tekst, backgroundColor: F.skifer },
  skanneLinje: { position: "absolute", left: 0, right: 0, top: "48%", height: 2, backgroundColor: F.gul },
  prikk: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  delta: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  usikker: { backgroundColor: F.gullys, borderRadius: 12, padding: 14, gap: 8 },
  valg: { height: 44, minWidth: 48, borderRadius: 8, borderWidth: 1.5, borderColor: F.tekst, backgroundColor: F.hvit, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
});
