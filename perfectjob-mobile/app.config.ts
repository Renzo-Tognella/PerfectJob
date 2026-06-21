import { ExpoConfig } from 'expo/config';

const apiUrl = process.env.API_URL || 'http://192.168.15.11:8080/api';
const isDev = process.env.APP_VARIANT === 'development';

const config: ExpoConfig = {
  name: 'PerfectJob',
  slug: 'perfectjob',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.perfectjob.app',
    supportsTablet: true,
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSAllowsLocalNetworking: true,
      },
    },
  },
  android: {
    package: 'com.perfectjob.app',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png' },
    usesCleartextTraffic: true,
  },
  plugins: ['expo-secure-store'],
  extra: {
    apiUrl,
    eas: { projectId: 'c5e9c4e0-0000-0000-0000-000000000000' },
  },
};

export default config;
