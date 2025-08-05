import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { formatPrice } from '../../utils/stripe';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentConfirmationProps {
  paymentIntentId: string;
  unitNumber: string;
  unitSize: number;
  totalAmount: number;
  accessCode?: string;
  paymentDate: string;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  paymentIntentId,
  unitNumber,
  unitSize,
  totalAmount,
  accessCode,
  paymentDate,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              ¡Pago Confirmado!
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              Tu trastero ha sido reservado correctamente
            </p>
          </div>

          <div className="mt-8">
            <div className="bg-gray-50 rounded-lg px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Detalles de la reserva
              </h3>
              
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">ID de pago:</dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {paymentIntentId.substring(0, 20)}...
                  </dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Trastero:</dt>
                  <dd className="text-sm text-gray-900">
                    {unitNumber} ({unitSize}m²)
                  </dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Importe:</dt>
                  <dd className="text-sm font-semibold text-gray-900">
                    {formatPrice(totalAmount)}
                  </dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Fecha:</dt>
                  <dd className="text-sm text-gray-900">
                    {format(new Date(paymentDate), 'dd MMMM yyyy, HH:mm', { locale: es })}
                  </dd>
                </div>
                
                {accessCode && (
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <dt className="text-sm font-medium text-gray-500">Código de acceso:</dt>
                    <dd className="text-sm font-bold text-primary-600 font-mono">
                      {accessCode}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {accessCode && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">
                      Tu código de acceso está listo
                    </p>
                    <p>
                      Usa este código para acceder a tu trastero las 24 horas del día. 
                      También puedes generar un código QR desde tu panel de control.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                to={ROUTES.DASHBOARD}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Ver mis trasteros
              </Link>
              
              <button
                onClick={() => window.print()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Imprimir recibo
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Recibirás un email de confirmación con todos los detalles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-10">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Próximos pasos
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100">
                  <span className="text-sm font-medium text-primary-600">1</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Dirígete a tu trastero</span><br />
                  Usa tu código de acceso para entrar
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100">
                  <span className="text-sm font-medium text-primary-600">2</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Gestiona tu alquiler</span><br />
                  Desde tu panel de control en cualquier momento
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100">
                  <span className="text-sm font-medium text-primary-600">3</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Soporte 24/7</span><br />
                  Contacta con nosotros si necesitas ayuda
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};