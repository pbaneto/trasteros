import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';
import { CheckoutForm } from '../components/payment/CheckoutForm';
import { PaymentMethodSelector } from '../components/payment/PaymentMethodSelector';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES, STORAGE_UNIT_SIZES, MONTHLY_PRICE, INSURANCE_OPTIONS, PAYMENT_METHODS } from '../utils/constants';
import { formatPrice } from '../utils/stripe';
import { useStorageUnits } from '../hooks/useStorageUnits';
import { supabase } from '../utils/supabase';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

interface ReservationData {
  unitId: string;
  unitNumber: string;
  unitSize: number;
  includeInsurance: boolean;
  monthlyPrice: number;
  insurancePrice: number;
  totalPrice: number;
}

interface PaymentContentProps {
  selectedSize: number;
  selectedInsurance: string;
  totalPrice: number;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  clientSecret: string;
  user: any;
  navigate: any;
  availability: any[];
  selectedInsuranceOption: any;
}

const PaymentContent: React.FC<PaymentContentProps> = ({
  selectedSize,
  selectedInsurance,
  totalPrice,
  paymentMethod,
  setPaymentMethod,
  isProcessing,
  setIsProcessing,
  clientSecret,
  user,
  navigate,
  availability,
  selectedInsuranceOption,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      let result;

      if (paymentMethod === 'card') {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${user?.firstName} ${user?.lastName}`,
              email: user?.email,
            },
          },
        });
      } else {
        throw new Error('Payment method not supported');
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent.status === 'succeeded') {
        await createRental(result.paymentIntent.id);
        toast.success('¡Pago completado exitosamente!');
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error procesando el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const createRental = async (paymentIntentId: string) => {
    try {
      // Generate random access code
      const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Create rental record
      const { data: rental, error: rentalError } = await supabase
        .from('rentals')
        .insert([
          {
            user_id: user.id,
            unit_id: `unit-${selectedSize}m2`,
            unit_number: `${selectedSize}m²`,
            unit_size: selectedSize,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            monthly_price: MONTHLY_PRICE,
            insurance_amount: selectedInsuranceOption?.price || 0,
            status: 'active',
            ttlock_code: accessCode,
            stripe_subscription_id: null,
          },
        ])
        .select()
        .single();

      if (rentalError) throw rentalError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            rental_id: rental.id,
            stripe_payment_intent_id: paymentIntentId,
            amount: totalPrice,
            status: 'succeeded',
            payment_date: new Date().toISOString(),
            payment_method: paymentMethod,
          },
        ]);

      if (paymentError) throw paymentError;
    } catch (error: any) {
      console.error('Error creating rental:', error);
      throw new Error('Error al crear el alquiler');
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
      />

      {paymentMethod === 'card' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">
            Detalles de la tarjeta
          </h4>
          <div className="p-4 border border-gray-300 rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Procesando...
          </div>
        ) : (
          `Pagar ${formatPrice(totalPrice)}`
        )}
      </button>

      {paymentMethod === 'google_pay' && (
        <button
          type="button"
          className="w-full bg-black text-white py-4 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Pagar con Google Pay
        </button>
      )}

      {paymentMethod === 'paypal' && (
        <button
          type="button"
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Pagar con PayPal
        </button>
      )}
    </form>
  );
};

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [showUnitSelection, setShowUnitSelection] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number | undefined>(
    searchParams.get('size') ? parseInt(searchParams.get('size')!) : undefined
  );
  const [selectedInsurance, setSelectedInsurance] = useState<string>('none');
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS.CARD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const { availability, loading: unitsLoading } = useStorageUnits();

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    // Get reservation data from sessionStorage
    const storedData = sessionStorage.getItem('reservationData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setReservationData(data);
      } catch (error) {
        console.error('Error parsing reservation data:', error);
        setShowUnitSelection(true);
      }
    } else {
      // No reservation data - show unit selection
      setShowUnitSelection(true);
    }
  }, [user, navigate]);

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
  const totalPrice = MONTHLY_PRICE + (selectedInsuranceOption?.price || 0);

  // Create payment intent when size is selected
  useEffect(() => {
    if (selectedSize && totalPrice > 0) {
      createPaymentIntent();
    }
  }, [selectedSize, totalPrice]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalPrice * 100, // Convert to cents
          currency: 'eur',
          metadata: {
            userId: user?.id,
            unitSize: selectedSize,
            includeInsurance: selectedInsurance !== 'none',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();
      setClientSecret(client_secret);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      // Don't show error toast for payment intent creation
    }
  };

  // Show loading while checking data or units
  if (unitsLoading || (!reservationData && !showUnitSelection)) {
    return (
      <ResponsiveLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  // Show unit selection if no reservation data
  if (showUnitSelection) {
    return (
      <ResponsiveLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Configura tu trastero
            </h1>
            <p className="text-lg text-gray-600">
              Selecciona el tamaño y seguro para tu trastero
            </p>
          </div>

          {/* Row 1: Storage Size Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Tamaño del trastero</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sizes.map((size) => {
                const isSelected = selectedSize === size.size;
                const isAvailable = size.availability && size.availability.availableCount > 0;
                
                return (
                  <button
                    key={size.size}
                    onClick={() => isAvailable ? setSelectedSize(size.size) : null}
                    disabled={!isAvailable}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50'
                        : isAvailable
                        ? 'border-gray-200 hover:border-primary-300 bg-white'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900">{size.label}</span>
                      <span className="text-lg font-bold text-primary-600">{formatPrice(MONTHLY_PRICE)}</span>
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

          {/* Row 2: Insurance Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Seguro de contenido</h2>
            <select
              value={selectedInsurance}
              onChange={(e) => setSelectedInsurance(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {INSURANCE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} {option.price > 0 && `- ${formatPrice(option.price)}/mes`}
                </option>
              ))}
            </select>
            {selectedInsuranceOption && selectedInsuranceOption.coverage > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Protege tus pertenencias hasta {formatPrice(selectedInsuranceOption.coverage)} contra daños, robos e incendios
              </p>
            )}
          </div>

          {/* Price Summary and Payment Button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-gray-900">Trastero</span>
              <span className="text-lg text-gray-900">{formatPrice(MONTHLY_PRICE)}/mes</span>
            </div>
            
            {selectedInsuranceOption && selectedInsuranceOption.price > 0 && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium text-gray-900">Seguro</span>
                <span className="text-lg text-gray-900">{formatPrice(selectedInsuranceOption.price)}/mes</span>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-bold text-gray-900">Total mensual</span>
                <span className="text-2xl font-bold text-primary-600">{formatPrice(totalPrice)}</span>
              </div>

              {/* Payment Methods - Show only when size is selected */}
              {selectedSize && (
                <Elements stripe={stripePromise}>
                  <PaymentContent
                    selectedSize={selectedSize}
                    selectedInsurance={selectedInsurance}
                    totalPrice={totalPrice}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    clientSecret={clientSecret}
                    user={user}
                    navigate={navigate}
                    availability={availability}
                    selectedInsuranceOption={selectedInsuranceOption}
                  />
                </Elements>
              )}

              {!selectedSize && (
                <p className="text-center text-gray-500 py-4">
                  Selecciona un tamaño para continuar con el pago
                </p>
              )}
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a
                href={ROUTES.HOME}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                Trasteros
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  Checkout
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Checkout Form */}
        {reservationData && (
          <CheckoutForm
            unitId={reservationData.unitId}
            unitNumber={reservationData.unitNumber}
            unitSize={reservationData.unitSize}
            includeInsurance={reservationData.includeInsurance}
            monthlyPrice={reservationData.monthlyPrice}
            insurancePrice={reservationData.insurancePrice}
            totalPrice={reservationData.totalPrice}
          />
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-gray-600 mb-4">
              Nuestro equipo de soporte está aquí para ayudarte
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <a
                href="tel:+34900000000"
                className="flex items-center text-primary-600 hover:text-primary-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                900 000 000
              </a>
              <span className="text-gray-400 hidden sm:block">•</span>
              <a
                href="mailto:soporte@trasteros.com"
                className="flex items-center text-primary-600 hover:text-primary-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                soporte@trasteros.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
};