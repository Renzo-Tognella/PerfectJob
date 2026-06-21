import { useMutation } from '@tanstack/react-query';
import { authApi, type LoginData, type RegisterData } from '@/services/api/authApi';
import { useAuthStore } from '@/store/useAuthStore';
import { extractErrorMessage } from '@/services/api/client';
import { ENV } from '@/config/env';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.accessToken, {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
      });
    },
    onError: (error) => {
      console.log('[DEBUG] Login error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.log('[DEBUG] API URL:', ENV.API_URL);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (data) => {
      setAuth(data.accessToken, {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
      });
    },
    onError: (error) => {
      console.log('[DEBUG] Register error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.log('[DEBUG] API URL:', ENV.API_URL);
    },
  });
};

export const useAuth = () => {
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  return {
    login: (data: LoginData) => loginMutation.mutateAsync(data),
    register: (data: Omit<RegisterData, 'confirmPassword'>) => registerMutation.mutateAsync(data),
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: extractErrorMessage(loginMutation.error) || extractErrorMessage(registerMutation.error) || null,
  };
};
