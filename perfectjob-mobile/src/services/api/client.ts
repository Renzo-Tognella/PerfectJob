import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Extracts a human-readable error message from an Axios error.
 * Checks the response body first, then falls back to generic messages.
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // API returned an error response with a body
    const data = error.response?.data;
    if (data?.message) {
      return data.message;
    }
    // Validation errors
    if (data?.details && typeof data.details === 'object') {
      const firstError = Object.values(data.details)[0];
      if (firstError) return String(firstError);
    }
    // Network error
    if (error.code === 'ERR_NETWORK') {
      return 'Sem conexão com o servidor. Verifique sua internet.';
    }
    // Timeout
    if (error.code === 'ECONNABORTED') {
      return 'O servidor demorou para responder. Tente novamente.';
    }
    // HTTP status codes without body
    const statusMessages: Record<number, string> = {
      400: 'Dados inválidos. Verifique as informações.',
      401: 'Email ou senha incorretos.',
      403: 'Você não tem permissão para acessar este recurso.',
      404: 'Recurso não encontrado.',
      409: 'Este email já está cadastrado.',
      429: 'Muitas tentativas. Aguarde um momento.',
      500: 'Erro interno do servidor. Tente novamente.',
    };
    const status = error.response?.status;
    if (status && statusMessages[status]) {
      return statusMessages[status];
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
