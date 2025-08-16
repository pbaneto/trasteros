import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { GoogleButton } from './GoogleButton';
import { PasswordInput } from '../ui/PasswordInput';

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
    <div className="p-6 space-y-4 md:space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
          Iniciar Sesión
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={handleSwitchToRegister}
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
          >
            Regístrate aquí
          </button>
        </p>
      </div>

      <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="nombre@empresa.com"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Contraseña
          </label>
          <PasswordInput
            {...register('password')}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="••••••••"
            error={errors.password?.message}
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleSwitchToReset}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>

        <div className="flex items-center">
          <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700"></div>
          <div className="px-5 text-center text-gray-500 dark:text-gray-400">
            <span className="bg-white px-2 text-sm dark:bg-gray-800">O continúa con</span>
          </div>
          <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <GoogleButton mode="signin" />
      </form>
    </div>
  );
};