import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { GoogleButton } from './GoogleButton';

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

export const RegisterForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

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
      toast.success('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
      // The AuthContext will handle user state and navigation via PublicRoute
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la cuenta');
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              inicia sesión en tu cuenta existente
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  className="input-field mt-1"
                  placeholder="Juan"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Apellidos
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  className="input-field mt-1"
                  placeholder="Pérez"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono (opcional)
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="input-field mt-1"
                placeholder="+34 612 345 678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                {...register('password')}
                type="password"
                className="input-field mt-1"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                className="input-field mt-1"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...register('acceptTerms')}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => window.open('/terms', '_blank')}
                  className="text-primary-600 hover:text-primary-500 underline"
                >
                  términos y condiciones
                </button>{' '}
                y la{' '}
                <button
                  type="button" 
                  onClick={() => window.open('/privacy', '_blank')}
                  className="text-primary-600 hover:text-primary-500 underline"
                >
                  política de privacidad
                </button>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">O regístrate con</span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleButton mode="signup" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};