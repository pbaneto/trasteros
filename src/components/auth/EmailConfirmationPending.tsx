import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import { toast } from 'react-toastify';

interface EmailConfirmationPendingProps {
  email: string;
}

export const EmailConfirmationPending: React.FC<EmailConfirmationPendingProps> = ({ email }) => {
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const { resendConfirmation, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    if (isResending) return;
    
    setIsResending(true);
    try {
      await resendConfirmation(email);
      toast.success('Email de confirmación reenviado. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      toast.error('Error al reenviar el email: ' + (error.message || 'Inténtalo más tarde'));
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying || !otpCode.trim()) return;
    
    setIsVerifying(true);
    try {
      await verifyOTP(email, otpCode.trim());
      toast.success('¡Email confirmado! Bienvenido a Trasteros.');
      navigate(ROUTES.DASHBOARD);
    } catch (error: any) {
      toast.error('Código incorrecto o expirado: ' + (error.message || 'Inténtalo de nuevo'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 6);
    setOtpCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-green-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 29l4 4 10-10M29 5l10 10-10 10" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ¡Cuenta Creada!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hemos enviado un email de confirmación a
          </p>
          <p className="text-center text-sm font-medium text-gray-900">
            {email}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Confirmación requerida
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Por favor, revisa tu email y haz clic en el enlace de confirmación para activar tu cuenta.
                  Si no ves el email, revisa tu carpeta de spam.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* OTP Input Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar con código
            </h3>
            
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Introduce el código de 6 dígitos del email:
                </label>
                <input
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={handleOtpInputChange}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying || otpCode.length !== 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Verificando...' : 'Confirmar código'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">o</span>
            </div>
          </div>

          {/* Resend Email Button */}
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? 'Reenviando...' : 'Reenviar email de confirmación'}
          </button>

          <div className="text-center">
            <Link
              to={ROUTES.LOGIN}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            ¿Problemas con el email?
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Revisa tu carpeta de spam o correo no deseado</li>
            <li>• Verifica que la dirección de email sea correcta</li>
            <li>• El enlace expira en 1 hora</li>
          </ul>
        </div>
      </div>
    </div>
  );
};