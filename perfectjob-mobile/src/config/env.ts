import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const ENV = {
  API_URL: extra.apiUrl ?? 'http://192.168.15.11:8080/api',
  IS_DEV: __DEV__,
  APP_VARIANT: extra.appVariant ?? 'development',
} as const;
