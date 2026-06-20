export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'PerfectJob Admin',
  ENV: (import.meta.env.VITE_ENV || 'development') as 'development' | 'staging' | 'production',
} as const;

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn('VITE_API_URL is not set in production build');
}
