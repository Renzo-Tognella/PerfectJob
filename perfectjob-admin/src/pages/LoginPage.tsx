import { useState } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Briefcase } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { login as loginApi } from '@/services/api/authApi';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const from = (location.state as { from?: Location } | null)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError('');
    try {
      const response = await loginApi(data);
      const user = {
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      };
      setAuth(response.accessToken, user);
      toast.success(`Bem-vindo, ${user.fullName || user.email}!`);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else {
        setServerError('Email ou senha inválidos');
      }
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-[#2B5FC2] flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PerfectJob</h1>
          <p className="text-sm text-gray-500 mt-1">Admin</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p className="text-sm text-red-600" role="alert">{serverError}</p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
