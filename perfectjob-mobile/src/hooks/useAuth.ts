import { useMutation } from '@tanstack/react-query';
import { authApi, type LoginData, type RegisterData } from '@/services/api/authApi';
import { useAuthStore } from '@/store/useAuthStore';
import { extractErrorMessage } from '@/services/api/client';

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
