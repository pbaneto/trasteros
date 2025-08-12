import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { STORAGE_UNIT_SIZES, UNIT_PRICE, INSURANCE_OPTIONS } from '../../utils/constants';
import { formatPrice } from '../../utils/stripe';
import { useStorageUnits } from '../../hooks/useStorageUnits';
import { toast } from 'react-toastify';

interface ReservationWizardProps {
  onClose: () => void;
}

type Step = 'size' | 'payment' | 'insurance' | 'summary';

export const ReservationWizard: React.FC<ReservationWizardProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { availability } = useStorageUnits();
  const [currentStep, setCurrentStep] = useState<Step>('size');
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<'single' | 'subscription'>('single');
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [selectedInsurance, setSelectedInsurance] = useState<string>('none');
  const [isProcessing, setIsProcessing] = useState(false);

  const sizes = [
    { 
      ...STORAGE_UNIT_SIZES.SMALL, 
      description: 'Perfecto para cajas y objetos pequeños',
      availability: availability.find(a => a.size === 2)
    },
    { 
      ...STORAGE_UNIT_SIZES.MEDIUM, 
      description: 'Ideal para muebles y electrodomésticos',
      availability: availability.find(a => a.size === 4)
    },
    { 
      ...STORAGE_UNIT_SIZES.LARGE, 
      description: 'Espacio amplio para mudanzas completas',
      availability: availability.find(a => a.size === 6)
    },
  ];

  const selectedInsuranceOption = INSURANCE_OPTIONS.find(option => option.id === selectedInsurance);
  const basePrice = paymentType === 'single' ? UNIT_PRICE * selectedMonths : UNIT_PRICE;
  const totalPrice = basePrice + (selectedInsuranceOption?.price || 0);

  const handleSizeSelect = (size: number) => {
    setSelectedSize(size);
    setCurrentStep('payment');
  };

  const handlePaymentTypeSelect = () => {
    setCurrentStep('insurance');
  };

  const handleInsuranceSelect = (insurance: string) => {
    setSelectedInsurance(insurance);
    setCurrentStep('summary');
  };

  const steps: Step[] = ['size', 'payment', 'insurance', 'summary'];
  const currentStepIndex = steps.indexOf(currentStep);

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

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
          unitPrice: UNIT_PRICE,
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
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Selecciona el tamaño de tu trastero
        </h3>
        <p className="text-gray-600">Elige el espacio que mejor se adapte a tus necesidades</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sizes.map((size) => {
          const isAvailable = size.availability && size.availability.availableCount > 0;
          
          return (
            <button
              key={size.size}
              onClick={() => isAvailable ? handleSizeSelect(size.size) : null}
              disabled={!isAvailable}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isAvailable
                  ? 'border-gray-200 hover:border-primary-300 bg-white hover:bg-primary-50'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-900">{size.label}</span>
                <span className="text-lg font-bold text-primary-600">{formatPrice(UNIT_PRICE)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{size.description}</p>
              <div className="text-xs">
                {isAvailable ? (
                  <span className="text-green-600 font-medium">
                    {size.availability!.availableCount} disponibles
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">No disponible</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Tipo de pago
        </h3>
        <p className="text-gray-600">Elige cómo prefieres pagar tu trastero</p>
      </div>

      <div className="space-y-4">
        <div 
          onClick={() => setPaymentType('single')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            paymentType === 'single' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-primary-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                paymentType === 'single' ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
              }`}>
                {paymentType === 'single' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
              </div>
              <span className="text-lg font-medium text-gray-900">Pago único</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">Paga por adelantado varios meses y ahorra</p>
          
          {paymentType === 'single' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cuántos meses?
              </label>
              <select
                value={selectedMonths}
                onChange={(e) => setSelectedMonths(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                {[1, 2, 3, 4, 5, 6, 12].map(months => (
                  <option key={months} value={months}>
                    {months} {months === 1 ? 'mes' : 'meses'} - {formatPrice(UNIT_PRICE * months)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div 
          onClick={() => setPaymentType('subscription')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            paymentType === 'subscription' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-primary-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                paymentType === 'subscription' ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
              }`}>
                {paymentType === 'subscription' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
              </div>
              <span className="text-lg font-medium text-gray-900">Suscripción mensual</span>
            </div>
            <span className="text-lg font-bold text-primary-600">{formatPrice(UNIT_PRICE)}/mes</span>
          </div>
          <p className="text-sm text-gray-600">Pago automático cada mes, cancela cuando quieras</p>
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <button
          onClick={handlePaymentTypeSelect}
          className="btn-primary px-8 py-2"
        >
          Continuar
        </button>
      </div>
    </div>
  );

  const renderInsuranceStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          ¿Deseas agregar seguro de contenido?
        </h3>
        <p className="text-gray-600">Protege tus pertenencias contra daños y robos</p>
      </div>

      <div className="space-y-3">
        {INSURANCE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => handleInsuranceSelect(option.id)}
            className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 bg-white hover:bg-primary-50 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium text-gray-900">{option.label}</span>
              {option.price > 0 && (
                <span className="text-lg font-bold text-primary-600">{formatPrice(option.price)}</span>
              )}
            </div>
            {option.coverage > 0 && (
              <p className="text-sm text-gray-600">
                Cobertura hasta {formatPrice(option.coverage)} contra daños, robos e incendios
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSummaryStep = () => {
    const selectedSizeInfo = sizes.find(s => s.size === selectedSize);
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Resumen de tu reserva
          </h3>
          <p className="text-gray-600">Revisa los detalles antes de proceder al pago</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-900">Trastero {selectedSizeInfo?.label}</span>
              <p className="text-sm text-gray-500">{selectedSizeInfo?.description}</p>
            </div>
            <span className="font-bold text-gray-900">{formatPrice(basePrice)}</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-900">Tipo de pago</span>
              <p className="text-sm text-gray-500">
                {paymentType === 'single' 
                  ? `Pago único - ${selectedMonths} ${selectedMonths === 1 ? 'mes' : 'meses'}` 
                  : 'Suscripción mensual'
                }
              </p>
            </div>
            <span className="font-bold text-gray-900">
              {paymentType === 'single' 
                ? formatPrice(UNIT_PRICE * selectedMonths)
                : `${formatPrice(UNIT_PRICE)}/mes`
              }
            </span>
          </div>
          
          {selectedInsuranceOption && selectedInsuranceOption.price > 0 && (
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium text-gray-900">Seguro de contenido</span>
                <p className="text-sm text-gray-500">
                  Cobertura hasta {formatPrice(selectedInsuranceOption.coverage)}
                </p>
              </div>
              <span className="font-bold text-gray-900">{formatPrice(selectedInsuranceOption.price)}</span>
            </div>
          )}
          
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-primary-600">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Redirigiendo a checkout...
              </div>
            ) : (
              `Proceder al pago - ${formatPrice(totalPrice)}`
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4 flex-1">
          {/* Navigation arrows */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousStep}
              disabled={currentStepIndex === 0}
              className={`p-2 rounded-full ${
                currentStepIndex === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToNextStep}
              disabled={currentStepIndex === steps.length - 1}
              className={`p-2 rounded-full ${
                currentStepIndex === steps.length - 1
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Progress indicator with step names */}
          <div className="flex items-center justify-center space-x-4 flex-1">
            {steps.map((step, index) => {
              const stepNames = {
                size: 'Tamaño',
                payment: 'Pago',
                insurance: 'Seguro',
                summary: 'Resumen'
              };
              
              const isActive = step === currentStep;
              const isCompleted = index < currentStepIndex;
              const isClickable = index <= currentStepIndex;
              
              return (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => isClickable && goToStep(step)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center space-y-1 ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isActive 
                        ? 'bg-primary-600 text-white' 
                        : isCompleted 
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span className={`text-xs ${
                      isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
                    }`}>
                      {stepNames[step]}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-px bg-gray-300 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 ml-4"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6">
        {currentStep === 'size' && renderSizeStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'insurance' && renderInsuranceStep()}
        {currentStep === 'summary' && renderSummaryStep()}
      </div>
    </div>
  );
};