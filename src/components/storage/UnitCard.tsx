import React from 'react';
import { StorageUnit } from '../../types';
import { formatPrice } from '../../utils/stripe';
import { UNIT_PRICE } from '../../utils/constants';

interface UnitCardProps {
  unit: StorageUnit;
  onReserve: (unit: StorageUnit) => void;
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, onReserve }) => {
  const isAvailable = unit.status === 'available';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-primary-600 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-primary-600">{unit.sizeM2}m²</div>
          </div>
        </div>
        
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
          isAvailable 
            ? 'bg-green-100 text-green-800' 
            : unit.status === 'maintenance' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-red-100 text-red-800'
        }`}>
          {unit.status === 'available' && 'Disponible'}
          {unit.status === 'occupied' && 'Ocupado'}
          {unit.status === 'maintenance' && 'Mantenimiento'}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Trastero {unit.unitNumber}
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              {formatPrice(UNIT_PRICE)}
            </div>
            <div className="text-sm text-gray-500">pago único</div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          {unit.locationDescription}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Acceso 24/7
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Código de acceso digital
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Videovigilancia
          </div>
        </div>

        <button
          onClick={() => onReserve(unit)}
          disabled={!isAvailable}
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors ${
            isAvailable
              ? 'btn-primary'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isAvailable ? 'Reservar Ahora' : 'No Disponible'}
        </button>
      </div>
    </div>
  );
};