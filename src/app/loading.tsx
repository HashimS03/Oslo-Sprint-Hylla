// Vises med en gang ved navigering, så appen svarer på trykk før dataene er klare.
export default function Laster() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <span className="h-4 w-4 animate-pulse border-[2.5px] border-tekst bg-gul" />
    </div>
  );
}
