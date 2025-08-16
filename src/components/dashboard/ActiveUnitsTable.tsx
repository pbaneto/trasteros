import React, { useState, useEffect } from 'react';
import { Rental, Payment } from '../../types';
import { formatPrice } from '../../utils/stripe';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { transformRentals, transformPayments } from '../../utils/mappers';

interface ActiveUnitsTableProps {
  onGenerateQR?: (rental: Rental) => void;
  onCancelSubscription?: (rental: Rental) => void;
}

export const ActiveUnitsTable: React.FC<ActiveUnitsTableProps> = ({
  onGenerateQR,
  onCancelSubscription,
}) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRentals, setExpandedRentals] = useState<Set<string>>(new Set());
  const [rentalPayments, setRentalPayments] = useState<Record<string, Payment[]>>({});
  const [loadingPayments, setLoadingPayments] = useState<Set<string>>(new Set());
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rentalToCancel, setRentalToCancel] = useState<Rental | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRentals();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          unit:storage_units(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRentals(transformRentals(data || []));
    } catch (error: any) {
      toast.error('Error al cargar tus trasteros');
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsForRental = async (rentalId: string) => {
    if (rentalPayments[rentalId]) return; // Already loaded

    setLoadingPayments(prev => new Set(prev).add(rentalId));
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          rental_id,
          stripe_payment_intent_id,
          amount,
          status,
          payment_date,
          payment_method,
          payment_type,
          subscription_id,
          billing_cycle_start,
          billing_cycle_end,
          is_subscription_active,
          next_billing_date,
          rental:rentals(
            id,
            unit:storage_units(unit_number, size_m2)
          )
        `)
        .eq('rental_id', rentalId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      setRentalPayments(prev => ({
        ...prev,
        [rentalId]: transformPayments(data as any || [])
      }));
    } catch (error: any) {
      toast.error('Error al cargar el historial de pagos');
      console.error('Error fetching payments:', error);
    } finally {
      setLoadingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(rentalId);
        return newSet;
      });
    }
  };

  const toggleRentalExpansion = (rentalId: string) => {
    const newExpanded = new Set(expandedRentals);
    if (newExpanded.has(rentalId)) {
      newExpanded.delete(rentalId);
    } else {
      newExpanded.add(rentalId);
      fetchPaymentsForRental(rentalId);
    }
    setExpandedRentals(newExpanded);
  };

  const handleCancelClick = (rental: Rental) => {
    setRentalToCancel(rental);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!rentalToCancel) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('rentals')
        .update({ status: 'cancelled' })
        .eq('id', rentalToCancel.id);

      if (error) throw error;

      // Update local state
      setRentals(prev => prev.map(rental => 
        rental.id === rentalToCancel.id 
          ? { ...rental, status: 'cancelled' }
          : rental
      ));

      toast.success('Trastero cancelado correctamente');
      setShowCancelModal(false);
      setRentalToCancel(null);

      // Call the parent callback if provided
      if (onCancelSubscription) {
        onCancelSubscription(rentalToCancel);
      }
    } catch (error: any) {
      toast.error('Error al cancelar el trastero');
      console.error('Error cancelling rental:', error);
    } finally {
      setCancelling(false);
    }
  };

  const getLastDayToRemoveStuff = (rental: Rental): string => {
    if (!rental.endDate) return 'No definido';
    
    // Add 7 days grace period after rental end date
    const endDate = new Date(rental.endDate + 'T00:00:00');
    const lastDay = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return format(lastDay, 'dd MMMM yyyy', { locale: es });
  };

  const shouldShowVerCodigo = (rental: Rental): boolean => {
    // Always show for active rentals
    if (rental.status === 'active') {
      return true;
    }
    
    // Also show if there's a payment intent ID (indicates direct payment was made)
    if (rental.stripePaymentIntentId) {
      return true;
    }
    
    // As fallback, check if there are succeeded direct payments for this rental
    const payments = rentalPayments[rental.id] || [];
    const hasSucceededDirectPayment = payments.some(payment => 
      payment.paymentType === 'single' && payment.status === 'succeeded'
    );
    
    return hasSucceededDirectPayment;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'expired':
        return 'Expirado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const isExpiringSoon = (endDate: string | null | undefined) => {
    if (!endDate) return false;
    const expiry = new Date(endDate + 'T00:00:00');
    if (isNaN(expiry.getTime())) return false;
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'google_pay':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          </svg>
        );
      case 'paypal':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81c1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes trasteros</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza alquilando tu primer trastero.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Mis Trasteros
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {rentals.length} {rentals.length === 1 ? 'trastero' : 'trasteros'}
        </span>
      </div>

      {/* Professional Cards Grid - Wider on Desktop */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
        {rentals.map((rental) => (
          <div key={rental.id} className="w-full bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            {/* Card Header with Unit Icon and Status */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl dark:bg-blue-900 flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                          Trastero {rental.unit?.unitNumber}
                        </h5>
                        <p className="text-base text-gray-500 dark:text-gray-400">
                          {rental.unit?.sizeM2}m² • {rental.unit?.locationDescription}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
                        {getStatusText(rental.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry Warning */}
              {rental.status === 'active' && isExpiringSoon(rental.endDate) && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-base font-medium text-orange-800 dark:text-orange-200">
                      Próximo a vencer
                    </span>
                  </div>
                </div>
              )}

              {/* Two-Column Layout for Wider Cards */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column - Unit Details */}
                <div className="space-y-4">
                  <h6 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Detalles del Trastero</h6>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Renovación:</span>
                      <span className={`text-sm font-semibold ${isExpiringSoon(rental.endDate) ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                        {rental.endDate ? format(new Date(rental.endDate + 'T00:00:00'), 'dd MMM yyyy', { locale: es }) : 'No definido'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Precio mensual:</span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(rental.price + (rental.insuranceAmount || 0))}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">suscripción</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-4">
                  <h6 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Acciones</h6>
                  <div className="space-y-3">
                    {shouldShowVerCodigo(rental) && onGenerateQR && (
                      <button
                        onClick={() => onGenerateQR(rental)}
                        className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-center text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800 dark:focus:ring-blue-800"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                        </svg>
                        Ver código de acceso
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleRentalExpansion(rental.id)}
                      className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-center text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Ver historial de pagos
                    </button>

                    {rental.status === 'active' && (
                      <button
                        onClick={() => handleCancelClick(rental)}
                        className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-center text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-900 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-800 dark:focus:ring-red-800"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Cancelar suscripción
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Payment History - Full Width */}
              {expandedRentals.has(rental.id) && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h6 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">Historial de Pagos</h6>
                  {loadingPayments.has(rental.id) ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {rentalPayments[rental.id]?.length > 0 ? (
                        rentalPayments[rental.id].map((payment) => (
                          <div key={payment.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <span className="text-gray-400 dark:text-gray-500">
                                  {getPaymentMethodIcon(payment.paymentMethod)}
                                </span>
                                <div>
                                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                                    {formatPrice(payment.amount)}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {payment.paymentDate 
                                      ? format(new Date(payment.paymentDate), 'dd MMM yyyy HH:mm', { locale: es })
                                      : 'No definido'
                                    }
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {payment.paymentMethod === 'card' && 'Tarjeta'}
                                    {payment.paymentMethod === 'google_pay' && 'Google Pay'}
                                    {payment.paymentMethod === 'paypal' && 'PayPal'}
                                    {!['card', 'google_pay', 'paypal'].includes(payment.paymentMethod) && payment.paymentMethod}
                                    {payment.paymentType === 'subscription' && ' • Suscripción'}
                                    {payment.paymentType === 'single' && ' • Pago único'}
                                  </div>
                                </div>
                              </div>
                              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusColor(payment.status)}`}>
                                {getPaymentStatusText(payment.status)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            No hay pagos registrados
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && rentalToCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Cancelar Trastero
                  </h3>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">
                          ¿Estás seguro de que quieres cancelar este trastero?
                        </h4>
                        <p className="text-sm text-yellow-700 mt-2">
                          Esta acción no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Trastero: </span>
                      <span className="text-sm text-gray-700">
                        {rentalToCancel.unit?.unitNumber} ({rentalToCancel.unit?.sizeM2}m²)
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-900">Último día para retirar tus pertenencias: </span>
                      <span className="text-sm font-semibold text-red-600">
                        {getLastDayToRemoveStuff(rentalToCancel)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    No, mantener
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={cancelling}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};