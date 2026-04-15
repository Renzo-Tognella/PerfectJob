import { useLocalSearchParams } from "expo-router";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return null;
}
