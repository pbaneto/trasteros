import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { GoogleButton } from './GoogleButton';
import { PasswordInput } from '../ui/PasswordInput';
import { ROUTES } from '../../utils/constants';

const registerSchema = z.object({
  firstName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar los 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/, 'El nombre solo puede contener letras'),
  lastName: z.string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos no pueden superar los 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/, 'Los apellidos solo pueden contener letras'),
  email: z.string()
    .email('Introduce un email válido')
    .max(100, 'El email no puede superar los 100 caracteres'),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[+]?[0-9\s\-()]{9,20}$/.test(val), 
      'Formato de teléfono inválido (ej: +34 612 345 678)'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula y 1 número'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos y condiciones'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.firstName, data.lastName, data.phone);
      // Navigate to email confirmation page with email in state
      navigate(ROUTES.EMAIL_CONFIRMATION_PENDING, { 
        state: { email: data.email } 
      });
      // Close modal if callback provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };


  const handleSwitchToLogin = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    }
  };

  return (
    <div className="p-6 space-y-4 md:space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
          Crear Cuenta
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={handleSwitchToLogin}
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>

      <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Nombre
            </label>
            <input
              {...register('firstName')}
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Juan"
            />
            {errors.firstName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Apellidos
            </label>
            <input
              {...register('lastName')}
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Pérez"
            />
            {errors.lastName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>

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
          <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Teléfono (opcional)
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="+34 612 345 678"
          />
          {errors.phone && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.phone.message}</p>
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

        <div>
          <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Confirmar Contraseña
          </label>
          <PasswordInput
            {...register('confirmPassword')}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
          />
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="acceptTerms" className="text-gray-500 dark:text-gray-300">
              Acepto los{' '}
              <button
                type="button"
                onClick={() => window.open('/terms', '_blank')}
                className="font-medium text-blue-600 hover:underline dark:text-blue-500"
              >
                términos y condiciones
              </button>{' '}
              y la{' '}
              <button
                type="button" 
                onClick={() => window.open('/privacy', '_blank')}
                className="font-medium text-blue-600 hover:underline dark:text-blue-500"
              >
                política de privacidad
              </button>
            </label>
          </div>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600 dark:text-red-500">{errors.acceptTerms.message}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>

        <div className="flex items-center">
          <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700"></div>
          <div className="px-5 text-center text-gray-500 dark:text-gray-400">
            <span className="bg-white px-2 text-sm dark:bg-gray-700">O regístrate con</span>
          </div>
          <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <GoogleButton mode="signup" />
      </form>
    </div>
  );
};