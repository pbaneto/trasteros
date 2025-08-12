import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const resetSchema = z.object({
  email: z.string().email('Introduce un email válido'),
});

type ResetFormData = z.infer<typeof resetSchema>;

interface PasswordResetProps {
  onSwitchToLogin?: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({
  onSwitchToLogin,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      toast.success('Email de recuperación enviado. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el email de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    }
  };

  if (emailSent) {
    return (
      <div className="p-6">
        <div className="w-full space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
              Email Enviado
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Hemos enviado un enlace de recuperación a tu email. 
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enviando...' : 'Enviar Email de Recuperación'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};