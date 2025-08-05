import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PricingSummary } from './PricingSummary';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutFormProps {
  unitId: string;
  unitNumber: string;
  unitSize: number;
  includeInsurance: boolean;
  monthlyPrice: number;
  insurancePrice: number;
  totalPrice: number;
}

const CheckoutFormContent: React.FC<CheckoutFormProps> = ({
  unitId,
  unitNumber,
  unitSize,
  includeInsurance,
  monthlyPrice,
  insurancePrice,
  totalPrice,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, []);

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
            unitId,
            unitNumber,
            includeInsurance: includeInsurance.toString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();
      setClientSecret(client_secret);
    } catch (error: any) {
      toast.error('Error al preparar el pago');
      console.error('Error creating payment intent:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
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
        // Handle other payment methods (Google Pay, PayPal)
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/payment-success`,
          },
        });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent?.status === 'succeeded') {
        // Create rental record in database
        await createRental(result.paymentIntent.id);
        
        toast.success('¡Pago procesado correctamente! Tu trastero ha sido reservado.');
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const createRental = async (paymentIntentId: string) => {
    try {
      // Generate TTLock access code (placeholder - implement actual TTLock integration)
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Calculate rental period (1 month from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Create rental record
      const { data: rental, error: rentalError } = await supabase
        .from('rentals')
        .insert([
          {
            user_id: user?.id,
            unit_id: unitId,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            monthly_price: monthlyPrice,
            insurance_amount: insurancePrice,
            status: 'active',
            ttlock_code: accessCode,
            stripe_subscription_id: null, // TODO: Create subscription for recurring payments
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

      // Update unit status to occupied
      const { error: unitError } = await supabase
        .from('storage_units')
        .update({ status: 'occupied' })
        .eq('id', unitId);

      if (unitError) throw unitError;

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
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Finalizar Reserva
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />

            {/* Card Details */}
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

            {/* Unit Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Detalles del trastero
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Trastero:</span>
                  <span>{unitNumber} ({unitSize}m²)</span>
                </div>
                <div className="flex justify-between">
                  <span>Período:</span>
                  <span>Mensual (renovación automática)</span>
                </div>
                <div className="flex justify-between">
                  <span>Inicio:</span>
                  <span>Inmediato</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                `Pagar ${totalPrice.toFixed(2)}€`
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <PricingSummary
            unitSize={unitSize}
            includeInsurance={includeInsurance}
          />
        </div>
      </div>
    </div>
  );
};

export const CheckoutForm: React.FC<CheckoutFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormContent {...props} />
    </Elements>
  );
};