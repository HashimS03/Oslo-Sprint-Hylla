import { redirect } from "next/navigation";

// Kontrollsiden er flyttet inn i dashboardet under Kamera.
export default function Side() {
  redirect("/lokasjoner");
}
