import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { STORAGE_UNIT_SIZES, INSURANCE_OPTIONS, getPriceBySize } from '../../utils/constants';
import { formatPrice } from '../../utils/stripe';
import { useStorageUnits } from '../../hooks/useStorageUnits';
import { toast } from 'react-toastify';

interface ReservationWizardProps {
  onClose: () => void;
  initialSize?: number | null;
}

type Step = 'size' | 'insurance' | 'summary';

export const ReservationWizard: React.FC<ReservationWizardProps> = ({ onClose, initialSize }) => {
  const { user } = useAuth();
  const { availability } = useStorageUnits();
  const [currentStep, setCurrentStep] = useState<Step>('size');
  const [selectedSize, setSelectedSize] = useState<number | null>(initialSize || null);
  const [paymentType, setPaymentType] = useState<'single' | 'subscription'>('single');
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [selectedInsurance, setSelectedInsurance] = useState<string>('none');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialSize && selectedSize === initialSize) {
      setCurrentStep('insurance');
    }
  }, [initialSize, selectedSize]);

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

  const selectedInsuranceOption = INSURANCE_OPTIONS.find(option => option.id === selectedInsurance);
  const unitPrice = selectedSize ? getPriceBySize(selectedSize) : STORAGE_UNIT_SIZES.SMALL.price;
  const basePrice = paymentType === 'single' ? unitPrice * selectedMonths : unitPrice;
  const totalPrice = basePrice + (selectedInsuranceOption?.price || 0);

  const handleSizeSelect = (size: number) => {
    setSelectedSize(size);
    setCurrentStep('insurance');
  };

  const handleInsuranceSelect = (insurance: string) => {
    setSelectedInsurance(insurance);
    setCurrentStep('summary');
  };

  const steps: Step[] = ['size', 'insurance', 'summary'];
  const currentStepIndex = steps.indexOf(currentStep);

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const goToStep = (step: Step) => {
    // Only allow going to previous steps or the next immediate step
    const targetIndex = steps.indexOf(step);
    if (targetIndex <= currentStepIndex || targetIndex === currentStepIndex + 1) {
      setCurrentStep(step);
    }
  };

  const handleCheckout = async () => {
    if (!user || !selectedSize) return;

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('Session state:', session);
      console.log('User from context:', user);
      
      if (!session) {
        throw new Error('Sesión no válida');
      }

      const { data: availableUnits, error: unitsError } = await supabase
        .from('storage_units')
        .select('*')
        .eq('size_m2', selectedSize)
        .eq('status', 'available')
        .limit(1);

      if (unitsError || !availableUnits || availableUnits.length === 0) {
        throw new Error('No hay unidades disponibles del tamaño seleccionado');
      }

      const selectedUnit = availableUnits[0];

      
      // Explicitly pass authorization header
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          unitId: selectedUnit.id,
          months: paymentType === 'single' ? selectedMonths : 1,
          paymentType,
          insurance: selectedInsurance !== 'none',
          insurancePrice: selectedInsuranceOption?.price || 0,
          insuranceCoverage: selectedInsuranceOption?.coverage || 0,
          unitPrice: unitPrice,
          totalPrice,
          unitSize: selectedSize,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Function response:', response);

      if (response.error) {
        console.error('Function error details:', response.error);
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

  const renderSizeStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:hidden">
        <p className="text-gray-600">Elige el espacio que mejor se adapte a tus necesidades</p>
      </div>
      <div className="text-center hidden sm:block">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Selecciona el tamaño de tu trastero
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-6 sm:mt-8">
        {sizes.map((size) => {
          const isAvailable = size.availability && size.availability.availableCount > 0;
          const isSelected = selectedSize === size.size;
          
          return (
            <div
              key={size.size}
              onClick={() => isAvailable ? handleSizeSelect(size.size) : null}
              className={`relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : isAvailable
                  ? 'border-gray-200 hover:border-primary-300 bg-white hover:bg-primary-50 hover:shadow-md'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
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
                  <div className="text-xl sm:text-2xl font-bold text-primary-600">{formatPrice(size.price)}/mes</div>
                  <div className="text-xs sm:text-sm text-gray-500">+ IVA</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {isAvailable ? (
                  <></>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      No disponible
                    </span>
                  )}
                </div>
                
                {isAvailable && (
                  <></>   
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // const renderPaymentStep = () => (
  //   <div className="space-y-4 sm:space-y-6">
  //     <div className="text-center sm:hidden">
  //       <p className="text-gray-600">Elige cómo prefieres pagar tu trastero</p>
  //     </div>
  //     <div className="text-center hidden sm:block">
  //       <h3 className="text-2xl font-bold text-gray-900 mb-3">
  //         Tipo de pago
  //       </h3>
  //       <p className="text-gray-600 text-lg">Elige cómo prefieres pagar tu trastero</p>
  //     </div>

  //     <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8">

  //       <div 
  //         onClick={() => setPaymentType('subscription')}
  //         className={`relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
  //           paymentType === 'subscription' 
  //             ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
  //             : 'border-gray-200 hover:border-primary-300 bg-white hover:bg-primary-50 hover:shadow-md'
  //         }`}
  //       >
  //         {paymentType === 'subscription' && (
  //           <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
  //             <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
  //               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  //             </svg>
  //           </div>
  //         )}
          
  //         <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
  //           <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-0">
  //             <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
  //               paymentType === 'subscription' ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
  //             }`}>
  //               {paymentType === 'subscription' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />}
  //             </div>
  //             <div>
  //               <h4 className="text-lg sm:text-xl font-bold text-gray-900">Suscripción mensual</h4>
  //               <p className="text-sm sm:text-base text-gray-600">Pago automático cada mes, cancela cuando quieras</p>
  //             </div>
  //           </div>
  //           <div className="text-left sm:text-right ml-7 sm:ml-0">
  //             <div className="text-xl sm:text-2xl font-bold text-primary-600">{formatPrice(unitPrice)}</div>
  //             <div className="text-xs sm:text-sm text-gray-500">por mes</div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

  const renderInsuranceStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:hidden">
        <p className="text-gray-600">Protege tus pertenencias contra daños y robos</p>
      </div>
      <div className="text-center hidden sm:block">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Elige el seguro de contenido
        </h3>
        <p className="text-gray-600 text-lg">Protege tus pertenencias contra daños y robos.</p>
      </div>

      <div className="space-y-4 mt-6 sm:mt-8">
        {INSURANCE_OPTIONS.map((option) => {
          const isSelected = selectedInsurance === option.id;
          
          return (
            <div
              key={option.id}
              onClick={() => handleInsuranceSelect(option.id)}
              className={`relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-primary-300 bg-white hover:bg-primary-50 hover:shadow-md'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-0">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />}
                  </div>
                    <div className="flex-1">
                      <h4 className="text-lg sm:text-xl font-bold text-gray-900">{option.label}</h4>
                    </div>
                </div>
                {option.price > 0 && (
                  <div className="text-left sm:text-right ml-7 sm:ml-0">
                    <div className="flex items-baseline gap-2">
                      <div className="text-xl sm:text-2xl font-bold text-primary-600">{formatPrice(option.price)}</div>
                      <div className="text-xs sm:text-sm text-gray-500">pago único</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSummaryStep = () => {
    const selectedSizeInfo = sizes.find(s => s.size === selectedSize);
    
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center sm:hidden">
          <p className="text-gray-600">Revisa los detalles antes de proceder al pago</p>
        </div>
        <div className="text-center hidden sm:block">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Resumen de tu reserva
          </h3>
          <p className="text-gray-600 text-lg">Revisa los detalles antes de proceder al pago</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6 mt-6 sm:mt-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 sm:py-4 border-b border-gray-200">
              <div className="mb-2 sm:mb-0">
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Trastero {selectedSizeInfo?.label}</h4>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(basePrice)}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 sm:py-4 border-b border-gray-200">
              <div className="mb-2 sm:mb-0">
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Pago mensual</h4>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {formatPrice(unitPrice)}/mes
                </div>
              </div>
            </div>
            
            {selectedInsuranceOption && selectedInsuranceOption.price > 0 && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 sm:py-4 border-b border-gray-200">
                <div className="mb-2 sm:mb-0">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900">Seguro de hasta {formatPrice(selectedInsuranceOption.coverage)}</h4>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(selectedInsuranceOption.price)}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Total a pagar</h4>
              <div className="text-2xl sm:text-3xl font-bold text-primary-600">{formatPrice(totalPrice)}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-white bg-primary-600 rounded-lg sm:rounded-xl hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-2 sm:mr-3"></div>
                <span className="text-sm sm:text-base">Redirigiendo a checkout...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm sm:text-base">Proceder al pago - {formatPrice(totalPrice)}</span>
              </div>
            )}
          </button>
          
          <p className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
            Pago seguro procesado por Stripe
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg">
        {/* Header with progress */}
        <div className="px-4 sm:px-6 py-6 sm:py-8 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reserva tu trastero</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors p-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Mobile-optimized progress indicator */}
          <div className="w-full">
            {/* Mobile: Compact horizontal progress */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {steps.map((step, index) => {
                    const isActive = step === currentStep;
                    const isCompleted = index < currentStepIndex;
                    
                    return (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive 
                            ? 'bg-primary-600 text-white' 
                            : isCompleted 
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        {index < steps.length - 1 && (
                          <div className="w-4 h-0.5 bg-gray-300 mx-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {currentStepIndex + 1} de {steps.length}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {(() => {
                    const stepNames = {
                      size: 'Selecciona tamaño',
                      insurance: 'Seguro de contenido',
                      summary: 'Confirmar reserva'
                    };
                    return stepNames[currentStep];
                  })()}
                </h3>
              </div>
            </div>

            {/* Desktop: Full progress indicator */}
            <ol className="hidden sm:flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 lg:text-base">
              {steps.map((step, index) => {
                const stepNames = {
                  size: 'Tamaño',
                  insurance: 'Seguro',
                  summary: 'Resumen'
                };
                
                const isActive = step === currentStep;
                const isCompleted = index < currentStepIndex;
                const isClickable = index <= currentStepIndex;
                
                return (
                  <li key={step} className={`flex md:w-full items-center ${
                    isActive ? 'text-primary-600 dark:text-primary-500' : 
                    isCompleted ? 'text-green-600 dark:text-green-500' : ''
                  } ${index < steps.length - 1 ? 'sm:after:content-[\'\'] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700' : ''}`}>
                    <button
                      onClick={() => isClickable && goToStep(step)}
                      disabled={!isClickable}
                      className={`flex items-center ${isClickable ? 'cursor-pointer hover:text-primary-700' : 'cursor-not-allowed'}`}
                    >
                      {isCompleted ? (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                        </svg>
                      ) : (
                        <span className={`mr-2 text-sm font-bold ${
                          isActive ? 'text-primary-600' : 'text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      )}
                      {stepNames[step]}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Content area */}
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-2xl mx-auto">
            {currentStep === 'size' && renderSizeStep()}
            {currentStep === 'insurance' && renderInsuranceStep()}
            {currentStep === 'summary' && renderSummaryStep()}
          </div>
        </div>

        {/* Navigation footer */}
        {currentStep !== 'summary' && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {currentStepIndex > 0 ? (
                <button
                  onClick={goToPreviousStep}
                  className="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors px-4 py-2"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>
              ) : (
                <div></div>
              )}
              
              <button
                onClick={() => {
                  if (currentStep === 'size' && selectedSize) {
                    setCurrentStep('insurance');
                  } else if (currentStep === 'insurance') {
                    setCurrentStep('summary');
                  }
                }}
                disabled={
                  (currentStep === 'size' && !selectedSize)
                }
                className="flex items-center px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
    </div>
  );
};