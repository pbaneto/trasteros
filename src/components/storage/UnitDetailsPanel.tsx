import React from 'react';
import { Rental } from '../../types';
import { formatPrice } from '../../utils/stripe';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UnitDetailsPanelProps {
  rental: Rental;
  onGenerateQR?: () => void;
  onRenew?: () => void;
}

export const UnitDetailsPanel: React.FC<UnitDetailsPanelProps> = ({
  rental,
  onGenerateQR,
  onRenew,
}) => {
  const isActive = rental.status === 'active';
  const isExpiringSoon = isActive && new Date(rental.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Trastero {rental.unit?.unitNumber}
            </h3>
            <p className="text-primary-100">
              {rental.unit?.sizeM2}m² - {rental.unit?.locationDescription}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : rental.status === 'expired'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
          }`}>
            {rental.status === 'active' && 'Activo'}
            {rental.status === 'expired' && 'Expirado'}
            {rental.status === 'cancelled' && 'Cancelado'}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rental Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Información del Alquiler</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Fecha de inicio:</span>
                <span className="text-sm text-gray-900">
                  {format(new Date(rental.startDate), 'dd MMMM yyyy', { locale: es })}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Fecha de vencimiento:</span>
                <span className={`text-sm font-medium ${isExpiringSoon ? 'text-orange-600' : 'text-gray-900'}`}>
                  {format(new Date(rental.endDate), 'dd MMMM yyyy', { locale: es })}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Precio mensual:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPrice(rental.monthlyPrice)}
                </span>
              </div>
              
              {rental.insuranceAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Seguro:</span>
                  <span className="text-sm text-gray-900">
                    {formatPrice(rental.insuranceAmount)} / mes
                  </span>
                </div>
              )}
            </div>

            {isExpiringSoon && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-orange-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 8.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h5 className="text-sm font-medium text-orange-800">
                      Renovación Próxima
                    </h5>
                    <p className="text-sm text-orange-700">
                      Tu alquiler vence pronto. Renueva para mantener el acceso.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Access Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Acceso</h4>
            
            {isActive && (
              <div className="space-y-3">
                {rental.ttlockCode && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Código de acceso:</div>
                    <div className="text-lg font-mono font-semibold text-gray-900">
                      {rental.ttlockCode}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  {onGenerateQR && (
                    <button
                      onClick={onGenerateQR}
                      className="flex-1 btn-secondary text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11V9l-6 6-6-6v7a1 1 0 001 1h10a1 1 0 001-1z" />
                      </svg>
                      Código QR
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-blue-800 mb-1">Instrucciones de acceso:</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• Introduce el código en el teclado de la cerradura</li>
                        <li>• También puedes usar el código QR desde tu móvil</li>
                        <li>• Acceso disponible las 24 horas, todos los días</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isActive && (
              <div className="text-center py-4">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-gray-500 text-sm">
                  Acceso no disponible
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isActive && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              {onRenew && (
                <button
                  onClick={onRenew}
                  className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors ${
                    isExpiringSoon
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'btn-primary'
                  }`}
                >
                  {isExpiringSoon ? 'Renovar Ahora' : 'Renovar Alquiler'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};