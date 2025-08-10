import React, { useState } from 'react';
import { Rental } from '../../types';
import { formatPrice } from '../../utils/stripe';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-toastify';

interface ContractRenewalProps {
  rental: Rental;
  isOpen: boolean;
  onClose: () => void;
  onRenewalComplete: () => void;
}

export const ContractRenewal: React.FC<ContractRenewalProps> = ({
  rental,
  isOpen,
  onClose,
  onRenewalComplete,
}) => {
  const [renewalPeriod, setRenewalPeriod] = useState(1); // months
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentEndDate = rental.endDate ? new Date(rental.endDate) : new Date();
  const newEndDate = addMonths(currentEndDate, renewalPeriod);
  const totalPrice = (rental.price + (rental.insuranceAmount || 0)) * renewalPeriod;

  const renewalOptions = [
    { months: 1, label: '1 mes', discount: 0 },
    { months: 3, label: '3 meses', discount: 0.05 },
    { months: 6, label: '6 meses', discount: 0.10 },
    { months: 12, label: '12 meses', discount: 0.15 },
  ];

  const handleRenewal = async () => {
    setIsProcessing(true);
    try {
      // Create payment intent for renewal
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalPrice * 100, // Convert to cents
          currency: 'eur',
          metadata: {
            rentalId: rental.id,
            renewalMonths: renewalPeriod,
            type: 'renewal',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();
      
      // In a real implementation, you would redirect to Stripe Checkout
      // or use Stripe Elements to collect payment
      // For now, we'll simulate a successful payment
      
      // Update rental end date
      const { error: rentalError } = await supabase
        .from('rentals')
        .update({
          end_date: newEndDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', rental.id);

      if (rentalError) throw rentalError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            rental_id: rental.id,
            stripe_payment_intent_id: 'pi_renewal_' + Date.now(), // Placeholder
            amount: totalPrice,
            status: 'succeeded',
            payment_date: new Date().toISOString(),
            payment_method: 'card',
          },
        ]);

      if (paymentError) throw paymentError;

      toast.success('¡Contrato renovado correctamente!');
      onRenewalComplete();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al renovar el contrato');
    } finally {
      setIsProcessing(false);
    }
  };

  const getDiscountedPrice = (originalPrice: number, discount: number) => {
    return originalPrice * (1 - discount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Renovar Contrato
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Renueva tu contrato para el Trastero {rental.unit?.unitNumber}
                  </p>
                </div>

                <div className="mt-4">
                  {/* Current Contract Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Contrato actual
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Vence el:</span>
                        <span className="font-medium">
                          {rental.endDate ? format(currentEndDate, 'dd MMMM yyyy', { locale: es }) : 'No definido'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precio pagado:</span>
                        <span>{formatPrice(rental.price + (rental.insuranceAmount || 0))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Renewal Options */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Período de renovación
                    </h4>
                    {renewalOptions.map((option) => {
                      const originalPrice = (rental.price + (rental.insuranceAmount || 0)) * option.months;
                      const discountedPrice = getDiscountedPrice(originalPrice, option.discount);
                      const savings = originalPrice - discountedPrice;

                      return (
                        <label
                          key={option.months}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                            renewalPeriod === option.months
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="renewalPeriod"
                              value={option.months}
                              checked={renewalPeriod === option.months}
                              onChange={(e) => setRenewalPeriod(parseInt(e.target.value))}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {option.label}
                                {option.discount > 0 && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    -{(option.discount * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              {option.discount > 0 && savings > 0 && (
                                <div className="text-xs text-green-600">
                                  Ahorras {formatPrice(savings)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(discountedPrice)}
                            </div>
                            {option.discount > 0 && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatPrice(originalPrice)}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* New Contract Details */}
                  <div className="mt-4 bg-primary-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-primary-900 mb-2">
                      Nuevo contrato
                    </h4>
                    <div className="space-y-1 text-sm text-primary-800">
                      <div className="flex justify-between">
                        <span>Nueva fecha de vencimiento:</span>
                        <span className="font-medium">
                          {format(newEndDate, 'dd MMMM yyyy', { locale: es })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total a pagar:</span>
                        <span className="font-bold text-lg">
                          {formatPrice(totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleRenewal}
              disabled={isProcessing}
              className="w-full inline-flex justify-center btn-primary sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                'Renovar Contrato'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="mt-3 w-full inline-flex justify-center btn-secondary sm:mt-0 sm:w-auto"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};