import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';
import { CheckoutForm } from '../components/payment/CheckoutForm';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';

interface ReservationData {
  unitId: string;
  unitNumber: string;
  unitSize: number;
  includeInsurance: boolean;
  monthlyPrice: number;
  insurancePrice: number;
  totalPrice: number;
}

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    // Get reservation data from sessionStorage
    const storedData = sessionStorage.getItem('reservationData');
    if (!storedData) {
      navigate(ROUTES.HOME);
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setReservationData(data);
    } catch (error) {
      console.error('Error parsing reservation data:', error);
      navigate(ROUTES.HOME);
    }
  }, [user, navigate]);

  // Show loading while checking data
  if (!reservationData) {
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

        {/* Security Badge */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium text-green-700">
              Pago seguro con SSL • Protegido por Stripe
            </span>
          </div>
        </div>

        {/* Checkout Form */}
        <CheckoutForm
          unitId={reservationData.unitId}
          unitNumber={reservationData.unitNumber}
          unitSize={reservationData.unitSize}
          includeInsurance={reservationData.includeInsurance}
          monthlyPrice={reservationData.monthlyPrice}
          insurancePrice={reservationData.insurancePrice}
          totalPrice={reservationData.totalPrice}
        />

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