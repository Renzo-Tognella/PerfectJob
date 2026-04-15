import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "PerfectJob",
  slug: "perfectjob",
  version: "1.0.0",
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080",
  },
});
