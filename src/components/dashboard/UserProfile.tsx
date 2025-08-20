import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-toastify';

// Spanish provinces data
const SPANISH_PROVINCES = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona',
  'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba',
  'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Gipuzkoa', 'Huelva', 'Huesca',
  'Islas Baleares', 'Jaén', 'A Coruña', 'La Rioja', 'Las Palmas', 'León', 'Lleida',
  'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Pontevedra',
  'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona',
  'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Bizkaia', 'Zamora', 'Zaragoza', 'Ceuta', 'Melilla'
];

const profileSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  dni: z.string().regex(/^\d{8}[A-Za-z]$/, 'El DNI debe tener 8 dígitos seguidos de una letra').optional(),
  street: z.string().min(3, 'La calle debe tener al menos 3 caracteres').optional(),
  streetNumber: z.string().min(1, 'El número es requerido').optional(),
  postalCode: z.string().min(5, 'El código postal debe tener 5 dígitos').max(5, 'El código postal debe tener 5 dígitos').optional(),
  municipality: z.string().min(2, 'El municipio debe tener al menos 2 caracteres').optional(),
  province: z.string().optional(),
  email: z.string().email('Introduce un email válido'),
  phone: z.string().optional(),
  useSameForBilling: z.boolean(),
  billingType: z.enum(['nif', 'cif']).optional(),
  billingName: z.string().optional(),
  billingNifCif: z.string().optional(),
  billingStreet: z.string().optional(),
  billingStreetNumber: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingMunicipality: z.string().optional(),
  billingProvince: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.useSameForBilling) {
    // When not using same info for billing, all billing fields are mandatory
    if (!data.billingName || data.billingName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre/razón social es obligatorio (mín. 2 caracteres)",
        path: ["billingName"],
      });
    }
    
    if (!data.billingNifCif || data.billingNifCif.trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El NIF/CIF es obligatorio (mín. 8 caracteres)",
        path: ["billingNifCif"],
      });
    }
    
    if (!data.billingStreet || data.billingStreet.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La calle es obligatoria (mín. 3 caracteres)",
        path: ["billingStreet"],
      });
    }
    
    if (!data.billingStreetNumber || data.billingStreetNumber.trim().length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El número es obligatorio",
        path: ["billingStreetNumber"],
      });
    }
    
    if (!data.billingPostalCode || data.billingPostalCode.trim().length !== 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El código postal es obligatorio (5 dígitos)",
        path: ["billingPostalCode"],
      });
    }
    
    if (!data.billingMunicipality || data.billingMunicipality.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El municipio es obligatorio (mín. 2 caracteres)",
        path: ["billingMunicipality"],
      });
    }
    
    if (!data.billingProvince || data.billingProvince.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La provincia es obligatoria",
        path: ["billingProvince"],
      });
    }
  }
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

export const UserProfile: React.FC<UserProfileProps> = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'none' | 'code'>('none');

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      dni: user?.dni || '',
      street: user?.street || '',
      streetNumber: user?.streetNumber || '',
      postalCode: user?.postalCode || '',
      municipality: user?.municipality || '',
      province: user?.province || '',
      email: user?.email || '',
      phone: user?.phone || '',
      useSameForBilling: true,
      billingType: 'nif',
      // Initialize billing fields with personal data by default
      billingName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : '',
      billingNifCif: user?.dni || '',
      billingStreet: user?.street || '',
      billingStreetNumber: user?.streetNumber || '',
      billingPostalCode: user?.postalCode || '',
      billingMunicipality: user?.municipality || '',
      billingProvince: user?.province || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Function to update billing fields based on personal data
  const updateBillingFromPersonal = () => {
    const currentValues = profileForm.getValues();
    profileForm.setValue('billingType', 'nif');
    profileForm.setValue('billingName', `${currentValues.firstName} ${currentValues.lastName}`.trim());
    profileForm.setValue('billingNifCif', currentValues.dni || '');
    profileForm.setValue('billingStreet', currentValues.street || '');
    profileForm.setValue('billingStreetNumber', currentValues.streetNumber || '');
    profileForm.setValue('billingPostalCode', currentValues.postalCode || '');
    profileForm.setValue('billingMunicipality', currentValues.municipality || '');
    profileForm.setValue('billingProvince', currentValues.province || '');
  };

  // Function to clear billing fields
  const clearBillingFields = () => {
    profileForm.setValue('billingType', 'nif');
    profileForm.setValue('billingName', '');
    profileForm.setValue('billingNifCif', '');
    profileForm.setValue('billingStreet', '');
    profileForm.setValue('billingStreetNumber', '');
    profileForm.setValue('billingPostalCode', '');
    profileForm.setValue('billingMunicipality', '');
    profileForm.setValue('billingProvince', '');
  };

  // Watch the checkbox value from the form
  const useSameForBilling = profileForm.watch('useSameForBilling');

  // Function to handle checkbox change
  const handleBillingCheckboxChange = (checked: boolean) => {
    profileForm.setValue('useSameForBilling', checked);
    
    if (checked) {
      // Fill billing fields with personal information
      updateBillingFromPersonal();
    } else {
      // Clear billing fields for user to enter new information
      clearBillingFields();
    }
  };


  const updateProfile = async (data: ProfileFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Prepare billing data based on useSameForBilling flag
      const billingData = data.useSameForBilling ? {
        // When using same info, copy personal data to billing fields
        billing_type: 'person',
        billing_name: `${data.firstName} ${data.lastName}`.trim(),
        billing_nif_cif: data.dni,
        billing_street: data.street,
        billing_street_number: data.streetNumber,
        billing_postal_code: data.postalCode,
        billing_municipality: data.municipality,
        billing_province: data.province,
      } : {
        // When using different info, use the form values
        billing_type: data.billingType === 'cif' ? 'company' : 'person',
        billing_name: data.billingName,
        billing_nif_cif: data.billingNifCif,
        billing_street: data.billingStreet,
        billing_street_number: data.billingStreetNumber,
        billing_postal_code: data.billingPostalCode,
        billing_municipality: data.billingMunicipality,
        billing_province: data.billingProvince,
      };

      const updateData = {
        first_name: data.firstName,
        last_name: data.lastName,
        dni: data.dni,
        street: data.street,
        street_number: data.streetNumber,
        postal_code: data.postalCode,
        municipality: data.municipality,
        province: data.province,
        phone: data.phone,
        billing_same_as_personal: data.useSameForBilling,
        ...billingData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users_profile')
        .update(updateData)
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

  // Flowbite classes
  const inputClasses = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  const buttonClasses = "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed";
  const secondaryButtonClasses = "text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600";

  const FormField: React.FC<{
    label: string;
    error?: string;
    children: React.ReactNode;
    badge?: React.ReactNode;
    required?: boolean;
  }> = ({ label, error, children, badge, required = false }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {badge}
      </div>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
      )}
    </div>
  );

  const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Phone Verification Alert */}
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
      
      {/* Profile Information */}
      <SectionCard title="Información Personal">
        <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FormField 
              label="Nombre" 
              error={profileForm.formState.errors.firstName?.message}
              required
            >
              <input
                {...profileForm.register('firstName')}
                type="text"
                className={inputClasses}
                placeholder="Juan"
              />
            </FormField>

            <FormField 
              label="Apellidos" 
              error={profileForm.formState.errors.lastName?.message}
              required
            >
              <input
                {...profileForm.register('lastName')}
                type="text"
                className={inputClasses}
                placeholder="García López"
              />
            </FormField>
            
            <FormField 
              label="DNI" 
              error={profileForm.formState.errors.dni?.message}
            >
              <input
                {...profileForm.register('dni')}
                type="text"
                className={inputClasses}
                placeholder="12345678A"
              />
            </FormField>
          </div>

          {/* Address Information */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">
              Dirección
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <FormField 
                  label="Calle" 
                  error={profileForm.formState.errors.street?.message}
                >
                  <input
                    {...profileForm.register('street')}
                    type="text"
                    className={inputClasses}
                    placeholder="Calle Mayor"
                  />
                </FormField>
              </div>
              
              <FormField 
                label="Número" 
                error={profileForm.formState.errors.streetNumber?.message}
              >
                <input
                  {...profileForm.register('streetNumber')}
                  type="text"
                  className={inputClasses}
                  placeholder="123"
                />
              </FormField>
              
              <FormField 
                label="Código Postal" 
                error={profileForm.formState.errors.postalCode?.message}
              >
                <input
                  {...profileForm.register('postalCode')}
                  type="text"
                  className={inputClasses}
                  placeholder="28001"
                  maxLength={5}
                />
              </FormField>
              
              <div className="sm:col-span-2 lg:col-span-2">
                <FormField 
                  label="Municipio" 
                  error={profileForm.formState.errors.municipality?.message}
                >
                  <input
                    {...profileForm.register('municipality')}
                    type="text"
                    className={inputClasses}
                    placeholder="Madrid"
                  />
                </FormField>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-2">
                <FormField 
                  label="Provincia" 
                  error={profileForm.formState.errors.province?.message}
                >
                  <select
                    {...profileForm.register('province')}
                    className={inputClasses}
                  >
                    <option value="">Selecciona una provincia</option>
                    {SPANISH_PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">
              Contacto
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField label="Email" required>
                <input
                  {...profileForm.register('email')}
                  type="email"
                  disabled
                  className="bg-gray-100 border border-gray-300 text-gray-500 text-sm rounded-lg cursor-not-allowed block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No se puede cambiar el email
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
            </div>
          </div>

          {/* Billing Information */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
              <h4 className="text-base font-medium text-gray-900 dark:text-white">
                Facturación
              </h4>
              
              <div className="flex items-center">
                <input
                  id="use-same-billing"
                  type="checkbox"
                  checked={useSameForBilling}
                  onChange={(e) => handleBillingCheckboxChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="use-same-billing" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  Usar la misma información para facturación
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              
              {!useSameForBilling && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
                    <div className="lg:col-span-1">
                      <FormField 
                        label="Documento" 
                        required
                      >
                        <select
                          {...profileForm.register('billingType')}
                          className={inputClasses}
                        >
                          <option value="nif">NIF</option>
                          <option value="cif">CIF</option>
                        </select>
                      </FormField>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <FormField 
                        label={profileForm.watch('billingType') === 'cif' ? 'CIF' : 'NIF'}
                        error={profileForm.formState.errors.billingNifCif?.message}
                        required
                      >
                        <input
                          {...profileForm.register('billingNifCif')}
                          type="text"
                          className={inputClasses}
                          placeholder={profileForm.watch('billingType') === 'cif' ? 'A12345678' : '12345678A'}
                        />
                      </FormField>
                    </div>
                    
                    <div className="sm:col-span-2 lg:col-span-3">
                      <FormField 
                        label="Nombre/Razón Social"
                        error={profileForm.formState.errors.billingName?.message}
                        required
                      >
                        <input
                          {...profileForm.register('billingName')}
                          type="text"
                          className={inputClasses}
                          placeholder="Nombre y Apellidos o Empresa S.L."
                        />
                      </FormField>
                    </div>
                  </div>
                  
                  {/* Billing Address */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <FormField 
                        label="Calle"
                        error={profileForm.formState.errors.billingStreet?.message}
                        required
                      >
                        <input
                          {...profileForm.register('billingStreet')}
                          type="text"
                          className={inputClasses}
                          placeholder="Calle Mayor"
                        />
                      </FormField>
                    </div>
                    
                    <FormField 
                      label="Número"
                      error={profileForm.formState.errors.billingStreetNumber?.message}
                      required
                    >
                      <input
                        {...profileForm.register('billingStreetNumber')}
                        type="text"
                        className={inputClasses}
                        placeholder="123"
                      />
                    </FormField>
                    
                    <FormField 
                      label="C.P."
                      error={profileForm.formState.errors.billingPostalCode?.message}
                      required
                    >
                      <input
                        {...profileForm.register('billingPostalCode')}
                        type="text"
                        className={inputClasses}
                        placeholder="28001"
                        maxLength={5}
                      />
                    </FormField>
                    
                    <FormField 
                      label="Municipio"
                      error={profileForm.formState.errors.billingMunicipality?.message}
                      required
                    >
                      <input
                        {...profileForm.register('billingMunicipality')}
                        type="text"
                        className={inputClasses}
                        placeholder="Madrid"
                      />
                    </FormField>
                    
                    <FormField 
                      label="Provincia"
                      error={profileForm.formState.errors.billingProvince?.message}
                      required
                    >
                      <select
                        {...profileForm.register('billingProvince')}
                        className={inputClasses}
                      >
                        <option value="">Selecciona una provincia</option>
                        {SPANISH_PROVINCES.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end border-t border-gray-200 dark:border-gray-600 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={buttonClasses}
            >
              {isLoading ? (
                <>
                  <svg className="inline mr-2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-600" fill="none" viewBox="0 0 100 101">
                    <path d="m100 50.5908c0 27.2013-22.0988 49.2999-49.2999 49.2999s-49.3-22.0986-49.3-49.2999c0-27.2013 22.0987-49.3 49.3-49.3s49.2999 22.0986 49.2999 49.3z" fill="currentColor"/>
                    <path d="m93.9676 39.0409c0-15.1-12.3-27.4-27.4-27.4s-27.4 12.3-27.4 27.4c0 15.1 12.3 27.4 27.4 27.4s27.4-12.3 27.4-27.4z" fill="currentFill"/>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Password Change */}
      <SectionCard title="Cambiar Contraseña">
        <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-6">
          <FormField 
            label="Contraseña Actual" 
            error={passwordForm.formState.errors.currentPassword?.message}
            required
          >
            <input
              {...passwordForm.register('currentPassword')}
              type="password"
              className={inputClasses}
              placeholder="••••••••"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField 
              label="Nueva Contraseña" 
              error={passwordForm.formState.errors.newPassword?.message}
              required
            >
              <input
                {...passwordForm.register('newPassword')}
                type="password"
                className={inputClasses}
                placeholder="••••••••"
              />
            </FormField>

            <FormField 
              label="Confirmar Nueva Contraseña" 
              error={passwordForm.formState.errors.confirmPassword?.message}
              required
            >
              <input
                {...passwordForm.register('confirmPassword')}
                type="password"
                className={inputClasses}
                placeholder="••••••••"
              />
            </FormField>
          </div>

          <div className="flex justify-end border-t border-gray-200 dark:border-gray-600 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={buttonClasses}
            >
              {isLoading ? (
                <>
                  <svg className="inline mr-2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-600" fill="none" viewBox="0 0 100 101">
                    <path d="m100 50.5908c0 27.2013-22.0988 49.2999-49.2999 49.2999s-49.3-22.0986-49.3-49.2999c0-27.2013 22.0987-49.3 49.3-49.3s49.2999 22.0986 49.2999 49.3z" fill="currentColor"/>
                    <path d="m93.9676 39.0409c0-15.1-12.3-27.4-27.4-27.4s-27.4 12.3-27.4 27.4c0 15.1 12.3 27.4 27.4 27.4s27.4-12.3 27.4-27.4z" fill="currentFill"/>
                  </svg>
                  Actualizando...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};