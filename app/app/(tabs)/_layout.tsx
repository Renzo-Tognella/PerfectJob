import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="applications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
