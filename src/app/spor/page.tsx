import { Chat } from "./Chat";

export const dynamic = "force-dynamic";

export default function Spor() {
  const stemme = !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID);
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col lg:py-4">
      <Chat stemme={stemme} />
    </div>
  );
}
