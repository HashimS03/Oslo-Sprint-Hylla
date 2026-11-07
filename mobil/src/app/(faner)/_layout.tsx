import { Tabs } from "expo-router";
import { FaneLinje, type FaneNavn } from "@/components/Faner";

export default function FaneLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigateToTab }) => (
        <FaneLinje
          aktiv={state.routes[state.index].name as FaneNavn}
          onVelg={(f) => {
            const rute = state.routes.find((r) => r.name === f.navn);
            if (rute) navigateToTab(rute.key);
          }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tell" />
      <Tabs.Screen name="spor" />
      <Tabs.Screen name="logg" />
      <Tabs.Screen name="varer" />
    </Tabs>
  );
}
