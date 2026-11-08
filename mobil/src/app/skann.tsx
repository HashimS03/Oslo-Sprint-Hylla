import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ApiFeil, hent, send } from "@/lib/api";
import { useHent } from "@/lib/useHent";
import { F, S, lagStil } from "@/lib/tema";
import { Etikett, Feilboks, Kort, Knapp, Laster, Skjerm, Txt } from "@/components/ui";

type Vare = { sku: string; navn: string };
type Varsel = { id: string; melding: string };
type Modus = "plukk" | "plassering";

// Generell skanner: én knapp. Du skanner strekkoden på en vare, ikke en hylle.
// Kameraet i taket ser hvor den ble tatt fra, og Hylla sier fra med en gang hvis du tok feil vare.
export default function Skann() {
  const { data, feil, last } = useHent<{ varer: Vare[] }>("/api/skanner");
  const [modus, setModus] = useState<Modus>("plukk"); // pakkeoppgaver skanner alltid ut (plukk)
  // Åpnet fra en pakkeoppgave: kameraet starter med en gang, og vi går tilbake til oppgaven når varen er skannet.
  const fraOppgave = useLocalSearchParams<{ oppgave?: string; sku?: string; antall?: string }>();
  const tilOppgave = !!fraOppgave.oppgave;
  const skalSkanne = Math.max(1, Number(fraOppgave.antall) || 1);
  const skannetForOppgave = useRef(0);
  const [apen, setApen] = useState(tilOppgave);
  const [varsler, setVarsler] = useState<Varsel[]>([]);
  const [ordre, setOrdre] = useState<Record<string, number>>({});
  const [plukket, setPlukket] = useState<Record<string, number>>({});
  const sist = useRef(new Date().toISOString());
  const sett = useRef(new Set<string>());

  function nye(liste: Varsel[]) {
    const ny = liste.filter((v) => !sett.current.has(v.id));
    if (!ny.length) return;
    ny.forEach((v) => sett.current.add(v.id));
    setVarsler((x) => [...ny, ...x].slice(0, 3));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    Speech.speak(ny[0].melding, { language: "nb-NO" });
  }

  // Spør jevnlig om varsler fra kontrollen.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        nye((await hent<{ varsler: Varsel[] }>(`/api/skanner/varsel?etter=${encodeURIComponent(sist.current)}`)).varsler);
      } catch { /* prøv igjen */ }
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const varer = data?.varer ?? [];
  const linjer = Object.keys(ordre);
  const ferdig = linjer.length > 0 && linjer.every((k) => (plukket[k] ?? 0) >= ordre[k]);

  return (
    <Skjerm tittel="Plukk og plassering">
      {feil && <Feilboks melding={feil} igjen={last} />}
      {!data && !feil && <Laster />}

      {varsler.map((v) => (
        <Kort key={v.id} farge={F.rodlys}>
          <Txt style={{ fontFamily: S.tekstHalvfet, color: F.rod }}>{v.melding}</Txt>
        </Kort>
      ))}

      <View style={st.modus}>
        {(["plukk", "plassering"] as Modus[]).map((m) => (
          <Pressable key={m} onPress={() => setModus(m)} style={[st.valg, m === modus && { backgroundColor: F.gullys, borderColor: F.gul }]}>
            <Txt style={{ fontFamily: S.tekstHalvfet }}>{m === "plukk" ? "Plukk" : "Plassering"}</Txt>
          </Pressable>
        ))}
      </View>

      <Knapp tekst="Skann" ikon="skann" onPress={() => setApen(true)} />

      <Kort>
        <View style={st.ordreTopp}>
          <Etikett>Plukkliste</Etikett>
          <Pressable
            onPress={() => {
              setOrdre(Object.fromEntries(varer.map((v, i) => [v.sku, 1 + (i % 2)])));
              setPlukket({});
            }}
          >
            <Txt style={{ fontFamily: S.tekstHalvfet }}>Ny ordre</Txt>
          </Pressable>
        </View>
        {linjer.length === 0 && <Txt style={{ color: F.dempet }}>Trykk «Ny ordre» for en ordre med flere varer.</Txt>}
        {linjer.map((k) => {
          const ok = (plukket[k] ?? 0) >= ordre[k];
          return (
            <Txt key={k} style={{ color: ok ? F.gronn : F.tekst, textDecorationLine: ok ? "line-through" : "none" }}>
              {ok ? "✓" : "○"} {ordre[k]} × {varer.find((v) => v.sku === k)?.navn} ({plukket[k] ?? 0}/{ordre[k]})
            </Txt>
          );
        })}
        {ferdig && <Txt style={{ color: F.gronn, fontFamily: S.tekstHalvfet }}>Ordren er plukket</Txt>}
      </Kort>

      <Modal visible={apen} animationType="slide" onRequestClose={() => setApen(false)}>
        <Leser
          modus={modus}
          varer={varer}
          varsler={varsler}
          onSkannet={(sku) => {
            if (tilOppgave && (!fraOppgave.sku || sku === fraOppgave.sku)) {
              skannetForOppgave.current += 1;
              if (skannetForOppgave.current >= skalSkanne) {
                // Litt pause så den ansatte ser «Plukket: …», så tilbake til oppgaven, som henter seg selv på nytt.
                setTimeout(() => {
                  setApen(false);
                  router.back();
                }, 700);
              }
            }
            if (modus === "plukk") setPlukket((p) => ({ ...p, [sku]: (p[sku] ?? 0) + 1 }));
          }}
          onVarsler={nye}
          onFerdig={() => {
            setApen(false);
            if (tilOppgave) router.back();
          }}
        />
      </Modal>
    </Skjerm>
  );
}

/** Kameravisning som leser strekkoder. Blir åpen så du kan skanne flere varer på rad. */
function Leser({
  modus, varer, varsler, onSkannet, onVarsler, onFerdig,
}: {
  modus: Modus; varer: Vare[]; varsler: Varsel[];
  onSkannet: (sku: string) => void; onVarsler: (v: Varsel[]) => void; onFerdig: () => void;
}) {
  const inn = useSafeAreaInsets();
  const [tillatelse, spor] = useCameraPermissions();
  const [status, setStatus] = useState("Hold strekkoden foran kameraet");
  const [ukjent, setUkjent] = useState<string | null>(null);
  const sistKode = useRef({ kode: "", tid: 0 });
  const opptatt = useRef(false);

  async function registrer(kode: string, sku?: string) {
    try {
      const r = await send<{ skann: { sku: string }; varsler: Varsel[] }>("/api/skanner", sku ? { sku, type: modus } : { kode, type: modus });
      const navn = varer.find((v) => v.sku === r.skann.sku)?.navn ?? r.skann.sku;
      setStatus(`${modus === "plukk" ? "Plukket" : "Plassert"}: ${navn}`);
      setUkjent(null);
      onSkannet(r.skann.sku);
      onVarsler(r.varsler);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch (e) {
      if (e instanceof ApiFeil && e.status === 404) {
        setUkjent(kode);
        setStatus("Ukjent strekkode. Hvilken vare er dette?");
      } else {
        setStatus(e instanceof Error ? e.message : "Skanningen feilet");
      }
    }
  }

  async function lest({ data: kode }: { data: string }) {
    const na = Date.now();
    if (opptatt.current || ukjent) return;
    if (sistKode.current.kode === kode && na - sistKode.current.tid < 2500) return; // samme kode leses mange ganger
    sistKode.current = { kode, tid: na };
    opptatt.current = true;
    await registrer(kode);
    opptatt.current = false;
  }

  async function koble(sku: string) {
    if (!ukjent) return;
    await send("/api/skanner/koble", { kode: ukjent, sku });
    await registrer(ukjent, sku);
  }

  const harKamera = !!tillatelse?.granted;
  return (
    <View style={[st.leser, { paddingTop: inn.top }]}>
      {harKamera && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"] }}
          onBarcodeScanned={lest}
        />
      )}
      {harKamera && <View pointerEvents="none" style={st.ramme} />}
      <View style={st.leserTopp}>
        <Txt style={st.leserTittel}>{modus === "plukk" ? "Plukk" : "Plassering"}</Txt>
        <Pressable onPress={onFerdig} hitSlop={12}><Txt style={st.leserTittel}>Ferdig</Txt></Pressable>
      </View>

      {tillatelse && !tillatelse.granted && (
        <View style={st.midt}>
          <Txt style={{ color: F.hvit }}>Hylla trenger kameraet for å lese strekkoder.</Txt>
          <Knapp tekst="Gi tilgang" onPress={spor} />
        </View>
      )}

      <View style={[st.leserBunn, { paddingBottom: Math.max(inn.bottom, 16) }]}>
        {varsler.slice(0, 1).map((v) => (
          <View key={v.id} style={st.varselBoks}><Txt style={{ color: F.rod, fontFamily: S.tekstHalvfet }}>{v.melding}</Txt></View>
        ))}
        <Txt style={{ color: F.hvit, fontFamily: S.tekstHalvfet }}>{status}</Txt>
        {ukjent && varer.map((v) => <Knapp key={v.sku} tekst={v.navn} onPress={() => koble(v.sku)} />)}
      </View>
    </View>
  );
}

const st = lagStil(() => ({
  modus: { flexDirection: "row", gap: 8 },
  valg: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: F.kant, backgroundColor: F.kort },
  ordreTopp: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  leser: { flex: 1, backgroundColor: F.mork },
  leserTopp: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  leserTittel: { color: F.hvit, fontFamily: S.tekstHalvfet, fontSize: 18 },
  ramme: { position: "absolute", left: "12%", right: "12%", top: "30%", height: 170, borderWidth: 3, borderColor: F.gul, borderRadius: 14 },
  midt: { flex: 1, padding: 16, gap: 10, justifyContent: "center" },
  leserBunn: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, gap: 8, backgroundColor: "rgba(17,21,23,0.85)" },
  varselBoks: { backgroundColor: F.rodlys, borderRadius: 10, padding: 12 },
}));
