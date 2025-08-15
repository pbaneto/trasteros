import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-toastify';
import { PhoneVerification } from '../auth/PhoneVerification';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(initialTab === 'password');

  // Check if user is coming from password recovery
  const isPasswordRecovery = initialTab === 'password';

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

  const handlePhoneVerified = () => {
    setShowPhoneVerification(false);
    toast.success('Teléfono verificado correctamente');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Check if user has active rentals
      const { data: activeRentals } = await supabase
        .from('rentals')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (activeRentals && activeRentals.length > 0) {
        toast.error('No puedes eliminar tu cuenta mientras tengas trasteros activos');
        return;
      }

      setIsLoading(true);

      // Delete user profile
      const { error: profileError } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', user?.id);

      if (profileError) throw profileError;

      toast.success('Solicitud de eliminación enviada. Tu cuenta será eliminada en 24 horas.');
      
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Mi Perfil</h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información Personal
            </h3>

            <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    {...profileForm.register('firstName')}
                    type="text"
                    className="input-field mt-1"
                  />
                  {profileForm.formState.errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apellidos
                  </label>
                  <input
                    {...profileForm.register('lastName')}
                    type="text"
                    className="input-field mt-1"
                  />
                  {profileForm.formState.errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    {...profileForm.register('email')}
                    type="email"
                    disabled
                    className="input-field mt-1 bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    El email no se puede cambiar
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    {...profileForm.register('phone')}
                    type="tel"
                    className="input-field mt-1"
                    placeholder="+34612345678"
                  />
                  {user?.phoneVerified && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verificado
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Security Section */}
          <div className="space-y-6">
            {/* Password Change Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Contraseña
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Cambia tu contraseña para mayor seguridad
                  </p>
                </div>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="text-primary-600 hover:text-primary-500 font-medium text-sm"
                  >
                    Cambiar
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  {!isPasswordRecovery && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contraseña Actual
                      </label>
                      <input
                        {...passwordForm.register('currentPassword')}
                        type="password"
                        className="input-field mt-1"
                        required
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                  )}

                  {isPasswordRecovery && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Restablecimiento de Contraseña
                          </h3>
                          <p className="mt-1 text-sm text-blue-700">
                            Has accedido desde un enlace de recuperación. Establece tu nueva contraseña a continuación.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nueva Contraseña
                    </label>
                    <input
                      {...passwordForm.register('newPassword')}
                      type="password"
                      className="input-field mt-1"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      {...passwordForm.register('confirmPassword')}
                      type="password"
                      className="input-field mt-1"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        passwordForm.reset();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Phone Verification Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Verificación de Teléfono
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {user?.phoneVerified 
                      ? `Tu teléfono ${user.phone} está verificado` 
                      : 'Verifica tu teléfono para mayor seguridad'
                    }
                  </p>
                </div>
                {user?.phoneVerified ? (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Verificado</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPhoneVerification(true)}
                    className="text-primary-600 hover:text-primary-500 font-medium text-sm"
                  >
                    Verificar
                  </button>
                )}
              </div>

              {!user?.phoneVerified && showPhoneVerification && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <PhoneVerification onVerified={handlePhoneVerified} />
                </div>
              )}
            </div>

            {/* Account Deletion */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Eliminar Cuenta
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Esta acción no se puede deshacer
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-500 font-medium text-sm disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};