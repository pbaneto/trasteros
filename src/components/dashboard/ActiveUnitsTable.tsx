import React, { useState, useEffect } from 'react';
import { Rental, Payment } from '../../types';
import { formatPrice } from '../../utils/stripe';
import { supabase, supabaseConfig } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { transformRentals, transformPayments } from '../../utils/mappers';

interface ActiveUnitsTableProps {
  onCancelSubscription?: (rental: Rental) => void;
}

export const ActiveUnitsTable: React.FC<ActiveUnitsTableProps> = ({
  onCancelSubscription,
}) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRentals, setExpandedRentals] = useState<Set<string>>(new Set());
  const [showAccessCodes, setShowAccessCodes] = useState<Set<string>>(new Set());
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
          stripe_invoice_id,
          status,
          payment_date,
          payment_method,
          payment_type,
          subscription_id,
          billing_cycle_start,
          billing_cycle_end,
          is_subscription_active,
          next_billing_date,
          unit_price,
          total_amount,
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
      toast.error('Error al cargar las facturas');
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

  const toggleAccessCode = (rentalId: string) => {
    const newShowAccessCodes = new Set(showAccessCodes);
    if (newShowAccessCodes.has(rentalId)) {
      newShowAccessCodes.delete(rentalId);
    } else {
      newShowAccessCodes.add(rentalId);
    }
    setShowAccessCodes(newShowAccessCodes);
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

      // Send WhatsApp cancellation notice
      try {
        // Fetch user's phone number from database to ensure we have the verified number
        const { data: userProfile, error: profileError } = await supabase
          .from('users_profile')
          .select('phone_number')
          .eq('id', user?.id)
          .single();

        if (userProfile?.phone_number && !profileError) {
          // Calculate evacuation deadline (last day to remove belongings)
          const evacuationDate = rentalToCancel.endDate 
            ? new Date(rentalToCancel.endDate + 'T00:00:00')
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days from now if no end date

          await supabase.functions.invoke('send-whatsapp-verification', {
            body: {
              phoneNumber: userProfile.phone_number,
              messageType: 'cancellation_notice',
              storageUnitNumber: rentalToCancel.unit?.unitNumber || 'N/A',
              evacuationDeadline: evacuationDate.toISOString()
            }
          });
          console.log('WhatsApp cancellation notice sent successfully');
        }
      } catch (whatsappError) {
        console.error('Error sending WhatsApp cancellation notice:', whatsappError);
        // Don't show error to user - cancellation was successful, WhatsApp is just a bonus
      }

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
    
    const endDate = new Date(rental.endDate + 'T00:00:00');
    const lastDay = new Date(endDate.getTime());
    
    return format(lastDay, 'd/M/yyyy');
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

  const isExpiringSoon = (endDate: string | null | undefined, status: string) => {
    if (!endDate) return false;
    const expiry = new Date(endDate + 'T00:00:00');
    if (isNaN(expiry.getTime())) return false;
    
    // Only show for cancelled rentals if there are still days left to remove belongings
    if (status === 'cancelled') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiry >= today;
    }
    
    // Don't show expiring warning for active rentals - they're active, not expiring
    return false;
  };

  const getRemainingDays = (endDate: string | null | undefined) => {
    if (!endDate) return 0;
    const expiry = new Date(endDate + 'T00:00:00');
    if (isNaN(expiry.getTime())) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };


  const handleDownloadInvoice = async (payment: Payment) => {
    if (!payment.stripeInvoiceId && !payment.stripePaymentIntentId) {
      toast.error('No hay factura disponible para este pago');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Error de autenticación');
        return;
      }

      const response = await fetch(`${supabaseConfig.url}/functions/v1/download-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentId: payment.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.type === 'no_invoice') {
          toast.error('Esta factura no está disponible para descarga');
          return;
        }
        throw new Error(errorData.error || 'Error al descargar la factura');
      }

      const result = await response.json();
      
      // Open the Stripe invoice PDF in a new tab
      window.open(result.downloadUrl, '_blank');
      
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      toast.error('Error al descargar la factura');
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
      {/* Professional Cards Grid - Wider on Desktop */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-1">
        {rentals.map((rental) => (
          <div key={rental.id} className="w-full bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            {/* Card Header with Unit Icon and Status */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl dark:bg-blue-900 flex items-center justify-center text-blue-900 font-bold dark:text-blue-100">
                      {rental.unit?.unitNumber}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                      Trastero {rental.unit?.sizeM2}m² 
                    </h5>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
                  {getStatusText(rental.status)}
                </span>
              </div>

              {/* Expiry Warning */}
              {isExpiringSoon(rental.endDate, rental.status) && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-orange-800 dark:text-orange-200">
                        Tiempo restante para retirar pertenencias
                      </span>
                      <span className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        {getRemainingDays(rental.endDate)} días restantes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Unit Details */}
                <div className="space-y-4">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                            Renovación:
                          </td>                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                            Precio mensual:
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                            <span className={isExpiringSoon(rental.endDate, rental.status) ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}>
                              {rental.endDate ? format(new Date(rental.endDate + 'T00:00:00'), 'd/M/yyyy') : 'No definido'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-right">
                              <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatPrice(rental.price)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </thead>
                    </table>
                  </div>
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    {shouldShowVerCodigo(rental) && (
                      <button
                        onClick={() => toggleAccessCode(rental.id)}
                        className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-center text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800 dark:focus:ring-blue-800 min-h-[44px] touch-manipulation"
                      >
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="truncate">Ver código de acceso</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleRentalExpansion(rental.id)}
                      className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-center text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-gray-700 min-h-[44px] touch-manipulation"
                    >
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate">Ver facturas</span>
                    </button>

                    {rental.status === 'active' && (
                      <button
                        onClick={() => handleCancelClick(rental)}
                        className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-center text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-900 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-800 dark:focus:ring-red-800 min-h-[44px] touch-manipulation"
                      >
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="truncate">Cancelar suscripción</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Access Code Display - Full Width */}
              {showAccessCodes.has(rental.id) && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h6 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">Código de Acceso</h6>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 dark:bg-blue-900/20 dark:border-blue-800">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div className="space-y-3">
                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                          Usa este código para acceder al trastero {rental.unit?.unitNumber}
                        </p>
                        <div className="bg-white border border-blue-300 rounded-lg p-4 dark:bg-gray-800 dark:border-blue-600">
                          <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                            {rental.ttlockCode || '123456'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expandable Invoice History - Table Format */}
              {expandedRentals.has(rental.id) && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h6 className="text-sm font-semibold text-gray-900 dark:text-white mb-6 uppercase tracking-wide">Pagos</h6>
                  {loadingPayments.has(rental.id) ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full mb-4 dark:bg-gray-700"></div>
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-12 bg-gray-200 rounded dark:bg-gray-700"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      {rentalPayments[rental.id]?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Fecha
                                  </th>
                                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Total
                                  </th>
                                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                  </th>
                                  <th className="px-2 md:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden md:inline">Acciones</span>
                                    <span className="md:hidden">PDF</span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                {rentalPayments[rental.id].map((payment) => (
                                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 dark:text-white">
                                      <div className="truncate max-w-[80px] md:max-w-none">
                                        {payment.paymentDate 
                                          ? format(new Date(payment.paymentDate), 'd/M/yyyy')
                                          : 'Pendiente'
                                        }
                                      </div>
                                    </td>
                                    <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                                      <div className="truncate max-w-[60px] md:max-w-none">
                                        {formatPrice(payment.totalAmount)}
                                      </div>
                                    </td>
                                    <td className="px-3 md:px-6 py-2 md:py-4">
                                      <span className={`inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        payment.status === 'succeeded' 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                          : payment.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                      }`}>
                                        <span className="hidden md:inline">
                                          {payment.status === 'succeeded' ? 'Pagado' : 
                                           payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                                        </span>
                                        <span className="md:hidden">
                                          {payment.status === 'succeeded' ? '✓' : 
                                           payment.status === 'pending' ? '⏳' : '✗'}
                                        </span>
                                      </span>
                                    </td>
                                    <td className="px-2 md:px-6 py-2 md:py-4 text-right text-xs md:text-sm font-medium">
                                      {payment.status === 'succeeded' && (payment.stripeInvoiceId || payment.stripePaymentIntentId) && (
                                        <button
                                          onClick={() => handleDownloadInvoice(payment)}
                                          className="inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                        >
                                          <svg className="w-3 h-3 md:w-4 md:h-4 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          <span className="hidden md:inline">Descargar</span>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No hay facturas</h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Las facturas aparecerán aquí una vez que se procesen los pagos.
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