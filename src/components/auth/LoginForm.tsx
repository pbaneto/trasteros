import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { GoogleButton } from './GoogleButton';
import { PasswordInput } from '../layout/PasswordInput';

const loginSchema = z.object({
  email: z.string()
    .email('Introduce un email válido')
    .max(100, 'El email no puede superar los 100 caracteres'),
  password: z.string()
    .min(1, 'La contraseña es requerida')
    .max(128, 'La contraseña no puede superar los 128 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSwitchToReset?: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSwitchToReset,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password); 
      if (onSuccess) {
        onSuccess();
      }
      toast.success('¡Bienvenido de vuelta!');
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };


  const handleSwitchToRegister = () => {
    if (onSwitchToRegister) {
      onSwitchToRegister();
    }
  };

  const handleSwitchToReset = () => {
    if (onSwitchToReset) {
      onSwitchToReset();
    }
  };

  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <button
              type="button"
              onClick={handleSwitchToRegister}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              crea una cuenta nueva
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="input-field mt-1"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <PasswordInput
                {...register('password')}
                className="mt-1"
                placeholder="••••••••"
                error={errors.password?.message}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSwitchToReset}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">O continúa con</span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleButton mode="signin" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};