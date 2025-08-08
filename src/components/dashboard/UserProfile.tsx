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
  currentPassword: z.string().min(6, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'phone'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

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
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerified = () => {
    setShowPhoneVerification(false);
    toast.success('Teléfono verificado correctamente');
    // Refresh user data or update local state
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

      // Note: Supabase doesn't allow deleting auth users from the client
      // This would need to be handled by an admin function or webhook
      toast.success('Solicitud de eliminación enviada. Tu cuenta será eliminada en 24 horas.');
      
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Información Personal', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { id: 'password', name: 'Seguridad', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )},
    { id: 'phone', name: 'Verificación', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    )},
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Información Personal
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Actualiza tu información personal y de contacto.
                </p>
              </div>

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
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Cambiar Contraseña
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Asegúrate de usar una contraseña segura.
                </p>
              </div>

              <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contraseña Actual
                  </label>
                  <input
                    {...passwordForm.register('currentPassword')}
                    type="password"
                    className="input-field mt-1"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

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

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </div>
                {/* Danger Zone */}
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Elimina permanentemente tu cuenta y todos tus datos asociados.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar Cuenta
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Phone Verification Tab */}
          {activeTab === 'phone' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Verificación de Teléfono
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Verifica tu número de teléfono para mayor seguridad.
                </p>
              </div>

              {user?.phoneVerified ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    Teléfono Verificado
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Tu número de teléfono {user.phone} está verificado.
                  </p>
                </div>
              ) : (
                <div>
                  {!showPhoneVerification ? (
                    <div className="text-center py-8">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 8.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        Teléfono No Verificado
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Verifica tu teléfono para recibir notificaciones importantes.
                      </p>
                      <button
                        onClick={() => setShowPhoneVerification(true)}
                        className="mt-4 btn-primary"
                      >
                        Verificar Teléfono
                      </button>
                    </div>
                  ) : (
                    <PhoneVerification onVerified={handlePhoneVerified} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};