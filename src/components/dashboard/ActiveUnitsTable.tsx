import React, { useState, useEffect } from 'react';
import { Rental } from '../../types';
import { formatPrice } from '../../utils/stripe';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { transformRentals } from '../../utils/mappers';

interface ActiveUnitsTableProps {
  onViewDetails?: (rental: Rental) => void;
  onGenerateQR?: (rental: Rental) => void;
  onReserveUnit?: () => void;
}

export const ActiveUnitsTable: React.FC<ActiveUnitsTableProps> = ({
  onViewDetails,
  onGenerateQR,
  onReserveUnit,
}) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRentals();
    }
  }, [user]);

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
            <div className="mt-6">
              <button
                type="button"
                onClick={onReserveUnit}
                className="btn-primary"
              >
                Reservar trastero
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rentals:', rentals)
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Mis Trasteros
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Gestiona tus trasteros alquilados y su estado.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trastero
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimiento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rentals.map((rental) => (
              <tr key={rental.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {rental.unit?.sizeM2}m²
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        Trastero {rental.unit?.unitNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {rental.unit?.locationDescription}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rental.status)}`}>
                    {getStatusText(rental.status)}
                  </span>
                  {rental.status === 'active' && isExpiringSoon(rental.endDate) && (
                    <div className="mt-1">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        Próximo a vencer
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className={isExpiringSoon(rental.endDate) ? 'text-orange-600 font-medium' : ''}>
                    {rental.endDate ? format(new Date(rental.endDate + 'T00:00:00'), 'dd MMM yyyy', { locale: es }) : 'No definido'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="font-medium">
                    {formatPrice(rental.price + (rental.insuranceAmount || 0))}
                  </div>
                  <div className="text-xs text-gray-500">pago único</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {rental.status === 'active' && onGenerateQR && (
                      <button
                        onClick={() => onGenerateQR(rental)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Ver código de acceso"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                    )}
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(rental)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Ver detalles
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};