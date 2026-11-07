import { Side } from "@/components/Nav";
import { Chat } from "./Chat";

export const dynamic = "force-dynamic";

export default function Spor() {
  const stemme = !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID);
  return (
    <Side>
      <Chat stemme={stemme} />
    </Side>
  );
}
