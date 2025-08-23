import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { STORAGE_UNIT_SIZES, getPriceBySize } from '../../utils/constants';
import { formatPrice } from '../../utils/stripe';
import { useStorageUnits } from '../../hooks/useStorageUnits';
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

// Step-specific validation schemas
const step1Schema = z.object({
  selectedSize: z.number().min(1, 'Selecciona un tamaño de trastero'),
});

const step2Schema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  dni: z.string().min(1, 'El DNI es obligatorio').regex(/^\d{8}[A-Za-z]$/, 'El DNI debe tener 8 dígitos seguidos de una letra'),
  email: z.string().email('Introduce un email válido'),
});

const step3Schema = z.object({
  phonePrefix: z.string().min(1, 'El prefijo es obligatorio'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
});

interface ReservationWizardProps {
  onClose: () => void;
  initialSize?: number | null;
}

const reservationSchema = z.object({
  selectedSize: z.number().min(1, 'Selecciona un tamaño de trastero'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  dni: z.string().min(1, 'El DNI es obligatorio').regex(/^\d{8}[A-Za-z]$/, 'El DNI debe tener 8 dígitos seguidos de una letra'),
  street: z.string().min(3, 'La calle debe tener al menos 3 caracteres').optional(),
  streetNumber: z.string().min(1, 'El número es requerido').optional(),
  postalCode: z.string().min(5, 'El código postal debe tener 5 dígitos').max(5, 'El código postal debe tener 5 dígitos').optional(),
  municipality: z.string().min(2, 'El municipio debe tener al menos 2 caracteres').optional(),
  province: z.string().optional(),
  email: z.string().email('Introduce un email válido'),
  phonePrefix: z.string().min(1, 'El prefijo es obligatorio'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
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

type ReservationFormData = z.infer<typeof reservationSchema>;

export const ReservationWizard: React.FC<ReservationWizardProps> = ({ onClose, initialSize }) => {
  
  const { user, refreshUser } = useAuth();
  const { availability } = useStorageUnits();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'none' | 'code'>('none');

  
  const form = useForm<ReservationFormData>({
    mode: 'onChange',
    defaultValues: {
      selectedSize: initialSize || undefined,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      dni: user?.dni || '',
      street: user?.street || '',
      streetNumber: user?.streetNumber || '',
      postalCode: user?.postalCode || '',
      municipality: user?.municipality || '',
      province: user?.province || '',
      email: user?.email || '',
      phonePrefix: '+34',
      phone: user?.phone || '',
      useSameForBilling: user?.billingSameAsPersonal ?? true,
      billingType: user?.billingType === 'company' ? 'cif' : 'nif',
      billingName: user?.billingName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : ''),
      billingNifCif: user?.billingNifCif || user?.dni || '',
      billingStreet: user?.billingStreet || user?.street || '',
      billingStreetNumber: user?.billingStreetNumber || user?.streetNumber || '',
      billingPostalCode: user?.billingPostalCode || user?.postalCode || '',
      billingMunicipality: user?.billingMunicipality || user?.municipality || '',
      billingProvince: user?.billingProvince || user?.province || '',
    },
  });

  useEffect(() => {
    // Clear any cached reservation data when starting fresh
    sessionStorage.removeItem('reservationData');
    sessionStorage.removeItem('wizardStep');
    sessionStorage.removeItem('wizardCanceled');
    
    // Clear form errors on mount
    form.clearErrors();
  }, [form]);

  useEffect(() => {
    const storedStep = sessionStorage.getItem('wizardStep');
    const wasCanceled = sessionStorage.getItem('wizardCanceled') === 'true';
    
    if (wasCanceled && storedStep === 'summary') {
      setShowCancelMessage(true);
      sessionStorage.removeItem('wizardStep');
      sessionStorage.removeItem('wizardCanceled');
    }
  }, []);

  const sizes = [
    { 
      ...STORAGE_UNIT_SIZES.SMALL, 
      description: 'Perfecto para cajas y objetos pequeños',
      availability: availability.find(a => a.size === 2)
    },
    { 
      ...STORAGE_UNIT_SIZES.MEDIUM, 
      description: 'Ideal para muebles y electrodomésticos',
      availability: availability.find(a => a.size === 3)
    },
    { 
      ...STORAGE_UNIT_SIZES.LARGE, 
      description: 'Espacio amplio para mudanzas completas',
      availability: availability.find(a => a.size === 5)
    },
    { 
      ...STORAGE_UNIT_SIZES.XLARGE, 
      description: 'Espacio amplio para mudanzas completas',
      availability: availability.find(a => a.size === 6)
    },
  ];

  const selectedSize = form.watch('selectedSize');
  const watchedFields = form.watch(['firstName', 'lastName', 'dni', 'email', 'phonePrefix', 'phone']);
  const [firstName, lastName, dni, email, phonePrefix, phone] = watchedFields;
  
  const unitPrice = selectedSize ? getPriceBySize(selectedSize) : STORAGE_UNIT_SIZES.SMALL.price;
  const ivaBasePrice = unitPrice * 0.21;
  const totalPriceWithIva = unitPrice + ivaBasePrice;

  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      const result = step1Schema.safeParse({ selectedSize });
      return result.success;
    } else if (currentStep === 2) {
      const result = step2Schema.safeParse({
        firstName,
        lastName,
        dni,
        email
      });
      return result.success;
    } else if (currentStep === 3) {
      const result = step3Schema.safeParse({
        phonePrefix,
        phone
      });
      return result.success;
    }
    
    return true;
  };

  const updateBillingFromPersonal = () => {
    const currentValues = form.getValues();
    form.setValue('billingType', 'nif');
    form.setValue('billingName', `${currentValues.firstName} ${currentValues.lastName}`.trim());
    form.setValue('billingNifCif', currentValues.dni || '');
    form.setValue('billingStreet', currentValues.street || '');
    form.setValue('billingStreetNumber', currentValues.streetNumber || '');
    form.setValue('billingPostalCode', currentValues.postalCode || '');
    form.setValue('billingMunicipality', currentValues.municipality || '');
    form.setValue('billingProvince', currentValues.province || '');
  };

  const clearBillingFields = () => {
    form.setValue('billingType', 'nif');
    form.setValue('billingName', '');
    form.setValue('billingNifCif', '');
    form.setValue('billingStreet', '');
    form.setValue('billingStreetNumber', '');
    form.setValue('billingPostalCode', '');
    form.setValue('billingMunicipality', '');
    form.setValue('billingProvince', '');
  };

  const useSameForBilling = form.watch('useSameForBilling');

  const handleBillingCheckboxChange = (checked: boolean) => {
    form.setValue('useSameForBilling', checked);
    if (checked) {
      updateBillingFromPersonal();
    } else {
      clearBillingFields();
    }
  };

  const nextStep = async () => {
    const values = form.getValues();
    let validationResult;
    
    if (currentStep === 1) {
      validationResult = step1Schema.safeParse({ selectedSize: values.selectedSize });
    } else if (currentStep === 2) {
      validationResult = step2Schema.safeParse({
        firstName: values.firstName,
        lastName: values.lastName,
        dni: values.dni,
        email: values.email
      });
    } else if (currentStep === 3) {
      validationResult = step3Schema.safeParse({
        phonePrefix: values.phonePrefix,
        phone: values.phone
      });
    }

    if (validationResult && !validationResult.success) {
      // Set form errors for the invalid fields
      validationResult.error.errors.forEach(error => {
        form.setError(error.path[0] as keyof ReservationFormData, {
          type: 'manual',
          message: error.message
        });
      });
      return;
    }
    
    // Save user information after step 2
    if (currentStep === 2 && user) {
      await saveUserProfileData(values);
    }
    
    const newStep = currentStep + 1;
    setCurrentStep(newStep);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: ReservationFormData) => {
    // Final validation using the complete schema
    const fullValidation = reservationSchema.safeParse(data);
    if (!fullValidation.success) {
      console.error('Final validation failed:', fullValidation.error);
      toast.error('Por favor, revisa todos los campos obligatorios');
      return;
    }
    
    if (!user || !data.selectedSize) return;

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesión no válida');

      const { data: availableUnits, error: unitsError } = await supabase
        .from('storage_units')
        .select('*')
        .eq('size_m2', data.selectedSize)
        .eq('status', 'available')
        .limit(1);

      if (unitsError || !availableUnits || availableUnits.length === 0) {
        throw new Error('No hay unidades disponibles del tamaño seleccionado');
      }

      const selectedUnit = availableUnits[0];

      // Update user profile
      const profileUpdateData = {
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
        updated_at: new Date().toISOString(),
      };

      if (!data.useSameForBilling) {
        Object.assign(profileUpdateData, {
          billing_type: data.billingType === 'cif' ? 'company' : 'person',
          billing_name: data.billingName,
          billing_nif_cif: data.billingNifCif,
          billing_street: data.billingStreet,
          billing_street_number: data.billingStreetNumber,
          billing_postal_code: data.billingPostalCode,
          billing_municipality: data.billingMunicipality,
          billing_province: data.billingProvince,
        });
      } else {
        Object.assign(profileUpdateData, {
          billing_type: 'person',
          billing_name: `${data.firstName} ${data.lastName}`.trim(),
          billing_nif_cif: data.dni,
          billing_street: data.street,
          billing_street_number: data.streetNumber,
          billing_postal_code: data.postalCode,
          billing_municipality: data.municipality,
          billing_province: data.province,
        });
      }

      const { error: profileError } = await supabase
        .from('users_profile')
        .update(profileUpdateData)
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        toast.error('No se pudo actualizar tu perfil, pero puedes continuar con la reserva');
      } else {
        await refreshUser();
      }

      const billingData = data.useSameForBilling ? {
        firstName: data.firstName,
        lastName: data.lastName,
        street: data.street,
        streetNumber: data.streetNumber,
        postalCode: data.postalCode,
        municipality: data.municipality,
        province: data.province,
        phone: data.phone
      } : {
        firstName: data.billingName,
        lastName: '',
        street: data.billingStreet,
        streetNumber: data.billingStreetNumber,
        postalCode: data.billingPostalCode,
        municipality: data.billingMunicipality,
        province: data.billingProvince,
        phone: data.phone
      };

      sessionStorage.setItem('reservationData', JSON.stringify({
        unitId: selectedUnit.id,
        unitNumber: selectedUnit.unit_number,
        unitSize: data.selectedSize,
        price: unitPrice,
        totalPrice: totalPriceWithIva,
        billingInfo: billingData,
      }));

      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          unitId: selectedUnit.id,
          months: 0,
          paymentType: 'subscription',
          unitPrice: totalPriceWithIva,
          totalPrice: totalPriceWithIva,
          unitSize: data.selectedSize,
          billingInfo: billingData,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No se pudo crear la sesión de checkout');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Error al procesar el checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSizeSelection = (size: number) => {
    form.setValue('selectedSize', size);
    // Auto-advance to next step after a short delay for visual feedback
    setTimeout(() => {
      nextStep();
    }, 300);
  };

  const handleSendVerificationCode = async () => {
    const phonePrefix = form.getValues('phonePrefix');
    const phoneNumber = form.getValues('phone');
    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;
    
    if (!phoneNumber) {
      toast.error('Introduce un número de teléfono primero');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('send-whatsapp-verification', {
        body: { phoneNumber: fullPhoneNumber }
      });

      if (error) {
        throw new Error(error.message || 'Error sending verification code');
      }

      setVerificationStep('code');
      toast.success('Código de verificación enviado por WhatsApp');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el código');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveUserProfileData = async (values: ReservationFormData) => {
    if (!user) return;
    
    try {
      const profileUpdateData = {
        first_name: values.firstName,
        last_name: values.lastName,
        dni: values.dni,
        street: values.street,
        street_number: values.streetNumber,
        postal_code: values.postalCode,
        municipality: values.municipality,
        province: values.province,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users_profile')
        .update(profileUpdateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error saving user profile data:', error);
        toast.error('No se pudo guardar tu información, pero puedes continuar');
      } else {
        await refreshUser();
        toast.success('Información guardada correctamente');
      }
    } catch (error: any) {
      console.error('Error saving user profile:', error);
      toast.error('Error al guardar la información');
    }
  };

  const handleVerifyCode = async (code: string) => {
    const phonePrefix = form.getValues('phonePrefix');
    const phoneNumber = form.getValues('phone');
    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('verify-phone-code', {
        body: { 
          phoneNumber: fullPhoneNumber, 
          verificationCode: code 
        }
      });

      if (error) {
        throw new Error(error.message || 'Código incorrecto');
      }

      setVerificationStep('none');
      toast.success('¡Teléfono verificado correctamente!');
      // Auto-advance to next step after successful verification
      nextStep();
    } catch (error: any) {
      toast.error(error.message || 'Código incorrecto');
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { number: 1},
    { number: 2},
    { number: 3},
    { number: 4}
  ];

  const inputClasses = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  const buttonClasses = "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed";
  const secondaryButtonClasses = "text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600";

  const FormField: React.FC<{
    label: string;
    error?: string;
    children: React.ReactNode;
    required?: boolean;
  }> = ({ label, error, children, required = false }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
      )}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona el tamaño de tu trastero</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {sizes.map((size) => {
                const isAvailable = size.availability && size.availability.availableCount > 0;
                const isSelected = selectedSize === size.size;
                
                return (
                  <div
                    key={size.size}
                    onClick={() => isAvailable ? handleSizeSelection(size.size) : null}
                    className={`relative p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : isAvailable
                        ? 'border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50 hover:shadow-md'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{size.label}</h4>
                        <p className="text-sm sm:text-base text-gray-600">{size.description}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatPrice(size.price)}/mes</div>
                        <div className="text-xs sm:text-sm text-gray-500">+ IVA</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        {!isAvailable && (
                          <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            No disponible
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {form.formState.errors.selectedSize && (
              <p className="text-center text-sm text-red-600">{form.formState.errors.selectedSize.message}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Información personal</h2>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField 
                  label="Nombre" 
                  error={form.formState.errors.firstName?.message}
                  required
                >
                  <input
                    {...form.register('firstName')}
                    type="text"
                    className={inputClasses}
                    placeholder="Juan"
                  />
                </FormField>

                <FormField 
                  label="Apellidos" 
                  error={form.formState.errors.lastName?.message}
                  required
                >
                  <input
                    {...form.register('lastName')}
                    type="text"
                    className={inputClasses}
                    placeholder="García López"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField 
                  label="DNI" 
                  error={form.formState.errors.dni?.message}
                  required
                >
                  <input
                    {...form.register('dni')}
                    type="text"
                    className={inputClasses}
                    placeholder="12345678A"
                  />
                </FormField>

                <FormField 
                  label="Email" 
                  error={form.formState.errors.email?.message}
                  required
                >
                <input
                  {...form.register('email')}
                  type="email"
                  disabled
                  className="bg-gray-100 border border-gray-300 text-gray-500 text-sm rounded-lg cursor-not-allowed block w-full p-2.5"
                />
              </FormField>
              </div>

              {/* Address Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-3">
                      <FormField 
                        label="Calle" 
                        error={form.formState.errors.street?.message}
                      >
                        <input
                          {...form.register('street')}
                          type="text"
                          className={inputClasses}
                          placeholder="Calle Mayor"
                        />
                      </FormField>
                    </div>
                    
                    <FormField 
                      label="Número" 
                      error={form.formState.errors.streetNumber?.message}
                    >
                      <input
                        {...form.register('streetNumber')}
                        type="text"
                        className={inputClasses}
                        placeholder="123"
                      />
                    </FormField>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField 
                      label="Código Postal" 
                      error={form.formState.errors.postalCode?.message}
                    >
                      <input
                        {...form.register('postalCode')}
                        type="text"
                        className={inputClasses}
                        placeholder="28001"
                        maxLength={5}
                      />
                    </FormField>
                    
                    <FormField 
                      label="Municipio" 
                      error={form.formState.errors.municipality?.message}
                    >
                      <input
                        {...form.register('municipality')}
                        type="text"
                        className={inputClasses}
                        placeholder="Madrid"
                      />
                    </FormField>
                    
                    <FormField 
                      label="Provincia" 
                      error={form.formState.errors.province?.message}
                    >
                      <select
                        {...form.register('province')}
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
            </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifica tu teléfono</h2>
            </div>
            <div className="text-center mb-8">
              <p className="text-gray-600">
                Para confirmar tu reserva, te enviaremos un código de verificación por WhatsApp.
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-16">
                    <FormField label="Prefijo" required>
                      <input
                        {...form.register('phonePrefix')}
                        type="text"
                        className={`${inputClasses} text-center`}
                        placeholder="+34"
                      />
                    </FormField>
                  </div>
                  
                  <div className="flex-1">
                    <FormField label="Teléfono" required>
                      <div className="flex gap-2">
                        <input
                          {...form.register('phone')}
                          type="tel"
                          className={`${inputClasses} flex-1`}
                          placeholder="612345678"
                        />
                        {verificationStep === 'none' && (
                          <button
                            type="button"
                            onClick={handleSendVerificationCode}
                            disabled={isProcessing}
                            className={`${buttonClasses} whitespace-nowrap hidden sm:block`}
                          >
                            {isProcessing ? 'Enviando...' : 'Verificar'}
                          </button>
                        )}
                      </div>
                    </FormField>
                  </div>
                </div>
                
                {verificationStep === 'none' && (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={isProcessing}
                    className={`${buttonClasses} w-full sm:hidden`}
                  >
                    {isProcessing ? 'Enviando...' : 'Verificar'}
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
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Resumen tu alquiler</h2>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              {selectedSize && (
                <div className="space-y-4">
                  <div className="py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Trastero {sizes.find(s => s.size === selectedSize)?.label}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {sizes.find(s => s.size === selectedSize)?.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatPrice(unitPrice)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <p className="text-sm text-gray-600">IVA (21%)</p>
                      <p className="text-sm text-gray-600">{formatPrice(ivaBasePrice)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between py-3">
                    <p className="text-lg font-medium text-gray-900">Total mensual</p>
                    <p className="text-xl font-bold text-blue-600">{formatPrice(totalPriceWithIva)}</p>
                  </div>
                </div>
              )}

              {/* Billing Information */}
              <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <input
                    id="billing-same"
                    type="checkbox"
                    checked={useSameForBilling}
                    onChange={(e) => handleBillingCheckboxChange(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white-300 rounded"
                  />
                  <label htmlFor="billing-same" className="ml-2 text-md font-medium text-gray-900">
                    Usar la misma información para facturación
                  </label>
                </div>
              </div>

              {!useSameForBilling && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
                    <div className="lg:col-span-1">
                      <FormField 
                        label="Documento" 
                        required
                      >
                        <select
                          {...form.register('billingType')}
                          className={inputClasses}
                        >
                          <option value="nif">NIF</option>
                          <option value="cif">CIF</option>
                        </select>
                      </FormField>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <FormField 
                        label={form.watch('billingType') === 'cif' ? 'CIF' : 'NIF'}
                        error={form.formState.errors.billingNifCif?.message}
                        required
                      >
                        <input
                          {...form.register('billingNifCif')}
                          type="text"
                          className={inputClasses}
                          placeholder={form.watch('billingType') === 'cif' ? 'A12345678' : '12345678A'}
                        />
                      </FormField>
                    </div>
                    
                    <div className="sm:col-span-2 lg:col-span-3">
                      <FormField 
                        label="Nombre/Razón Social"
                        error={form.formState.errors.billingName?.message}
                        required
                      >
                        <input
                          {...form.register('billingName')}
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
                        error={form.formState.errors.billingStreet?.message}
                        required
                      >
                        <input
                          {...form.register('billingStreet')}
                          type="text"
                          className={inputClasses}
                          placeholder="Calle Mayor"
                        />
                      </FormField>
                    </div>
                    
                    <FormField 
                      label="Número"
                      error={form.formState.errors.billingStreetNumber?.message}
                      required
                    >
                      <input
                        {...form.register('billingStreetNumber')}
                        type="text"
                        className={inputClasses}
                        placeholder="123"
                      />
                    </FormField>
                    
                    <FormField 
                      label="C.P."
                      error={form.formState.errors.billingPostalCode?.message}
                      required
                    >
                      <input
                        {...form.register('billingPostalCode')}
                        type="text"
                        className={inputClasses}
                        placeholder="28001"
                        maxLength={5}
                      />
                    </FormField>
                    
                    <FormField 
                      label="Municipio"
                      error={form.formState.errors.billingMunicipality?.message}
                      required
                    >
                      <input
                        {...form.register('billingMunicipality')}
                        type="text"
                        className={inputClasses}
                        placeholder="Madrid"
                      />
                    </FormField>
                    
                    <FormField 
                      label="Provincia"
                      error={form.formState.errors.billingProvince?.message}
                      required
                    >
                      <select
                        {...form.register('billingProvince')}
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

            {/* Features */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Tu trastero incluye:</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Acceso 24/7 con código digital
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sistema de videovigilancia
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cancelación sin permanencia
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        
        {/* Cancellation Alert */}
        {showCancelMessage && (
          <div className="mb-6 mx-4 sm:mx-6 lg:mx-8 rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Pago cancelado. Puedes continuar con tu reserva completando el formulario.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps with Navigation */}
        <div className="mb-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left Arrow - Hidden on mobile when on first step */}
            <button
              type="button"
              onClick={currentStep === 1 ? () => {} : prevStep}
              disabled={currentStep === 1}
              className={`p-2 rounded-full transition-opacity ${
                currentStep === 1 
                  ? 'text-gray-300 cursor-not-allowed sm:opacity-100 opacity-0' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Progress Steps */}
            <nav aria-label="Progress" className="flex-1">
              <ol className="flex items-center justify-center space-x-2 sm:space-x-3">
                {steps.map((step) => (
                  <li key={step.number} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          // Allow navigation to previous steps or current step
                          if (step.number <= currentStep || step.number === currentStep) {
                            setCurrentStep(step.number);
                          }
                        }}
                        disabled={step.number > currentStep}
                        className={`flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-colors ${
                          currentStep >= step.number
                            ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                            : 'border-gray-300 bg-white text-gray-500 cursor-not-allowed'
                        } ${step.number <= currentStep ? 'cursor-pointer' : ''}`}
                      >
                        {currentStep > step.number ? (
                          <svg className="h-3 w-3 sm:h-3 sm:w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-xs sm:text-xs font-medium">{step.number}</span>
                        )}
                      </button>
                    </div>
                    {step.number < steps.length && (
                      <div className="ml-2 sm:ml-4 h-0.5 w-6 sm:w-12 bg-gray-300" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            {/* Right Arrow - Hidden on mobile when on last step */}
            <button
              type="button"
              onClick={currentStep === 4 ? () => {} : nextStep}
              disabled={currentStep === 4 || !isCurrentStepValid()}
              className={`p-2 rounded-full transition-opacity ${
                currentStep === 4 || !isCurrentStepValid()
                  ? 'text-gray-300 cursor-not-allowed sm:opacity-100 opacity-0' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>           

          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          <form onSubmit={(e) => e.preventDefault()}>
            
            {/* Step Content */}
            <div className="min-h-[500px]">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-6 gap-4">
              {/* Mobile: All buttons centered, Desktop: Previous/Cancel left, Next/Submit right */}
              <div className="flex gap-3 order-2 sm:order-1">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                  >
                    Anterior
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                >
                  Cancelar
                </button>
              </div>

              {/* Next/Submit button */}
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isCurrentStepValid()}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => form.handleSubmit(onSubmit)()}
                  disabled={isProcessing}
                  className="px-8 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </div>
                  ) : (
                    `Proceder al pago • ${selectedSize ? formatPrice(totalPriceWithIva) : '---'}`
                  )}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};