"use client";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useState } from "react";
import type { Kort } from "@/lib/types";
import { MikrofonKnapp, type Melding, type Sender } from "./Chat";

type Props = {
  leggTil: (m: Omit<Melding, "id">) => void;
  leggTilKort: (k: Kort) => void;
  render: (sender: Sender | null, knapp: React.ReactNode) => React.ReactNode;
};

export function ElevenLabsStemme(p: Props) {
  return (
    <ConversationProvider>
      <Indre {...p} />
    </ConversationProvider>
  );
}

// ---------------- ElevenLabs ----------------

function Indre({
  leggTil,
  leggTilKort,
  render,
}: {
  leggTil: (m: Omit<Melding, "id">) => void;
  leggTilKort: (k: Kort) => void;
  render: (sender: Sender | null, knapp: React.ReactNode) => React.ReactNode;
}) {
  const [feil, setFeil] = useState("");
  const conv = useConversation({
    clientTools: {
      vis_kort: async (p: Record<string, unknown>) => {
        const res = await fetch(`/api/kort?type=${encodeURIComponent(String(p.type ?? "vare"))}&id=${encodeURIComponent(String(p.id ?? ""))}`);
        if (!res.ok) return "Fant ikke det som skulle vises.";
        leggTilKort((await res.json()).kort);
        return "Kortet vises på skjermen.";
      },
    },
    onMessage: (m) => leggTil({ rolle: m.role === "user" ? "bruker" : "hylla", tekst: m.message }),
    onError: (e) => setFeil(typeof e === "string" ? e : "Stemmetilkoblingen feilet"),
  });
  const aktiv = conv.status === "connected";
  const kobler = conv.status === "connecting";

  const veksle = async () => {
    setFeil("");
    if (aktiv || kobler) return conv.endSession();
    const res = await fetch("/api/stemme/token");
    const data = await res.json();
    if (!data.aktiv) return setFeil(data.feil ?? "ElevenLabs er ikke satt opp");
    conv.startSession({ conversationToken: data.token, connectionType: "webrtc" });
  };

  const sender: Sender | null = aktiv
    ? (t) => {
        leggTil({ rolle: "bruker", tekst: t });
        conv.sendUserMessage(t);
      }
    : null;

  return render(
    sender,
    <MikrofonKnapp
      aktiv={aktiv}
      bolge={aktiv && conv.isSpeaking}
      tekst={feil || (kobler ? "Kobler til …" : aktiv ? (conv.isSpeaking ? "Hylla snakker · trykk for å avslutte" : "Lytter · bare snakk") : "Trykk og snakk")}
      onClick={veksle}
    />,
  );
}

