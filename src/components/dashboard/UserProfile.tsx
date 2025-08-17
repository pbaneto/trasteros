import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-toastify';

const profileSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  email: z.string().email('Introduce un email válido'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserProfileProps {
  initialTab?: 'profile' | 'password' | 'phone';
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  initialTab = 'profile' 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'none' | 'code'>('none');
  const [showPasswordForm, setShowPasswordForm] = useState(initialTab === 'password');


  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const updateProfile = async (data: ProfileFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast.success('Contraseña actualizada correctamente');
      passwordForm.reset();
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    const phoneValue = profileForm.getValues('phone');
    if (!phoneValue) {
      toast.error('Introduce un número de teléfono primero');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-whatsapp-verification', {
        body: { phoneNumber: phoneValue }
      });

      if (error) {
        throw new Error(error.message || 'Error sending verification code');
      }

      setVerificationStep('code');
      toast.success('Código de verificación enviado por WhatsApp');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    const phoneValue = profileForm.getValues('phone');
    
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('verify-phone-code', {
        body: { 
          phoneNumber: phoneValue, 
          verificationCode: code 
        }
      });

      if (error) {
        throw new Error(error.message || 'Código incorrecto');
      }

      setVerificationStep('none');
      toast.success('¡Teléfono verificado correctamente!');
    } catch (error: any) {
      toast.error(error.message || 'Código incorrecto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar tu cuenta? Podrás reactivarla contactando con soporte.')) {
      return;
    }

    try {
      setIsLoading(true);

      // Use the database function to deactivate account (bypasses RLS)
      const { error: deactivationError } = await supabase.rpc('deactivate_user_account');

      if (deactivationError) throw deactivationError;

      // Sign out the user after deactivation
      await supabase.auth.signOut();

      toast.success('Tu cuenta ha sido desactivada correctamente');

      // Refresh the page to see the changes
      window.location.reload();
    } catch (error: any) {
      let errorMessage = 'Error al desactivar la cuenta';
      
      if (error.message?.includes('active rentals')) {
        errorMessage = 'No puedes desactivar tu cuenta mientras tengas trasteros activos';
      } else if (error.message?.includes('already inactive')) {
        errorMessage = 'La cuenta ya está desactivada';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  const buttonClasses = "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed";
  const secondaryButtonClasses = "text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-4 py-2 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600";

  const FormField: React.FC<{
    label: string;
    error?: string;
    children: React.ReactNode;
    badge?: React.ReactNode;
  }> = ({ label, error, children, badge }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        {badge}
      </div>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {!user?.phoneVerified && (
        <div className="flex p-4 text-sm text-amber-800 rounded-lg bg-amber-50 dark:bg-gray-800 dark:text-amber-300" role="alert">
          <svg className="flex-shrink-0 w-4 h-4 mr-3 mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
          </svg>
          <div>
            <span className="font-medium">Verificación requerida</span>
            <div className="mt-1 text-sm">
              Para alquilar un trastero necesitas verificar tu número de teléfono primero.
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Información Personal
          </h3>
        </div>
        
        <form onSubmit={profileForm.handleSubmit(updateProfile)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Nombre" 
              error={profileForm.formState.errors.firstName?.message}
            >
              <input
                {...profileForm.register('firstName')}
                type="text"
                className={inputClasses}
              />
            </FormField>

            <FormField 
              label="Apellidos" 
              error={profileForm.formState.errors.lastName?.message}
            >
              <input
                {...profileForm.register('lastName')}
                type="text"
                className={inputClasses}
              />
            </FormField>
          </div>

          <FormField label="Email">
            <input
              {...profileForm.register('email')}
              type="email"
              disabled
              className="bg-gray-100 border border-gray-300 text-gray-500 text-sm rounded-lg cursor-not-allowed block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No se puede cambiar
            </p>
          </FormField>

          <FormField 
            label="Teléfono"
            badge={user?.phoneVerified && (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                <span className="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
                Verificado
              </span>
            )}
          >
            <div className="flex gap-3">
              <input
                {...profileForm.register('phone')}
                type="tel"
                className={inputClasses}
                placeholder="+34612345678"
              />
              {!user?.phoneVerified && verificationStep === 'none' && (
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={isLoading}
                  className={`${buttonClasses} whitespace-nowrap`}
                >
                  {isLoading ? 'Enviando...' : 'Verificar'}
                </button>
              )}
            </div>
            
            {verificationStep === 'code' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700">
                <p className="text-sm text-blue-800 dark:text-blue-300 text-center mb-3">
                  Hemos enviado un código de 6 dígitos por WhatsApp
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 text-center text-xl tracking-widest dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="123456"
                    maxLength={6}
                    onChange={(e) => {
                      if (e.target.value.length === 6) {
                        handleVerifyCode(e.target.value);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerificationStep('none')}
                    className={`${secondaryButtonClasses} whitespace-nowrap`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </FormField>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Contraseña
              </h4>
              {!showPasswordForm && (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                >
                  Cambiar
                </button>
              )}
            </div>

            {showPasswordForm && (
              <div className="space-y-4">
                <FormField 
                  label="Contraseña Actual" 
                  error={passwordForm.formState.errors.currentPassword?.message}
                >
                  <input
                    {...passwordForm.register('currentPassword')}
                    type="password"
                    className={inputClasses}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    label="Nueva Contraseña" 
                    error={passwordForm.formState.errors.newPassword?.message}
                  >
                    <input
                      {...passwordForm.register('newPassword')}
                      type="password"
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField 
                    label="Confirmar Nueva Contraseña" 
                    error={passwordForm.formState.errors.confirmPassword?.message}
                  >
                    <input
                      {...passwordForm.register('confirmPassword')}
                      type="password"
                      className={inputClasses}
                    />
                  </FormField>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      passwordForm.reset();
                    }}
                    className={secondaryButtonClasses}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={passwordForm.handleSubmit(updatePassword)}
                    disabled={isLoading}
                    className={buttonClasses}
                  >
                    {isLoading ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-gray-200 dark:border-gray-600 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`${buttonClasses} px-6`}
            >
              {isLoading ? 'Guardando...' : 'Guardar Información'}
            </button>
          </div>
        </form>
      </div>

      {/* <div className="bg-white rounded-lg shadow-sm border border-red-200 dark:bg-gray-800 dark:border-red-700">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                Desactivar Cuenta
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Esta acción desactivará tu cuenta. Podrás reactivarla contactando con soporte
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={isLoading}
              className="ml-6 text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Desactivar
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
};