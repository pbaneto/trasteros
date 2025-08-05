import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';

const phoneSchema = z.object({
  phone: z.string().regex(/^\+34[0-9]{9}$/, 'Introduce un número de teléfono válido (+34XXXXXXXXX)'),
});

const verificationSchema = z.object({
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;

interface PhoneVerificationProps {
  onVerified: () => void;
}

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({ onVerified }) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const codeForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  const sendVerificationCode = async (data: PhoneFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement SMS sending logic with Twilio or similar
      // This would call your backend API to send SMS
      const response = await fetch('/api/send-verification-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: data.phone }),
      });

      if (!response.ok) {
        throw new Error('Error sending verification code');
      }

      setPhoneNumber(data.phone);
      setStep('code');
      toast.success('Código de verificación enviado');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (data: VerificationFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement SMS verification logic
      const response = await fetch('/api/verify-sms-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          code: data.code 
        }),
      });

      if (!response.ok) {
        throw new Error('Código incorrecto');
      }

      toast.success('¡Teléfono verificado correctamente!');
      onVerified();
    } catch (error: any) {
      toast.error(error.message || 'Código incorrecto');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Verificar Teléfono
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Te enviaremos un código SMS para verificar tu número
          </p>
        </div>

        <form onSubmit={phoneForm.handleSubmit(sendVerificationCode)} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Número de Teléfono
            </label>
            <input
              {...phoneForm.register('phone')}
              type="tel"
              className="input-field mt-1"
              placeholder="+34612345678"
            />
            {phoneForm.formState.errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {phoneForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enviando...' : 'Enviar Código'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Introducir Código
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Hemos enviado un código de 6 dígitos al {phoneNumber}
        </p>
      </div>

      <form onSubmit={codeForm.handleSubmit(verifyCode)} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Código de Verificación
          </label>
          <input
            {...codeForm.register('code')}
            type="text"
            className="input-field mt-1 text-center text-2xl tracking-widest"
            placeholder="123456"
            maxLength={6}
          />
          {codeForm.formState.errors.code && (
            <p className="mt-1 text-sm text-red-600">
              {codeForm.formState.errors.code.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verificando...' : 'Verificar Código'}
        </button>

        <button
          type="button"
          onClick={() => setStep('phone')}
          className="w-full text-center text-sm text-primary-600 hover:text-primary-500"
        >
          Cambiar número de teléfono
        </button>
      </form>
    </div>
  );
};