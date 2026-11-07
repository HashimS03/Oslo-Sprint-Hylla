import { redirect } from "next/navigation";

// Det kameraet ser vises nå rett i Oversikt, Hendelser, Lokasjoner og Avvik.
export default function Kamera() {
  redirect("/lokasjoner");
}
