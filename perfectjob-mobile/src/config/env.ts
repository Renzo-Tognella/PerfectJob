import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const ENV = {
  API_URL: extra.apiUrl ?? 'http://localhost:8080/api',
  IS_DEV: __DEV__,
  APP_VARIANT: extra.appVariant ?? 'development',
} as const;
