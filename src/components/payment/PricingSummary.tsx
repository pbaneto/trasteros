import React from 'react';
import { formatPrice } from '../../utils/stripe';
import { MONTHLY_PRICE, INSURANCE_PRICE, INSURANCE_COVERAGE } from '../../utils/constants';

interface PricingSummaryProps {
  unitSize: number;
  includeInsurance: boolean;
  className?: string;
}

export const PricingSummary: React.FC<PricingSummaryProps> = ({
  unitSize,
  includeInsurance,
  className = '',
}) => {
  const monthlyPrice = MONTHLY_PRICE;
  const insurancePrice = includeInsurance ? INSURANCE_PRICE : 0;
  const totalPrice = monthlyPrice + insurancePrice;

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Resumen del Alquiler
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">
              Trastero {unitSize}m²
            </div>
            <div className="text-sm text-gray-500">
              Alquiler mensual
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {formatPrice(monthlyPrice)}
          </div>
        </div>

        {includeInsurance && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Seguro de contenido
              </div>
              <div className="text-sm text-gray-500">
                Cobertura hasta {formatPrice(INSURANCE_COVERAGE)}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatPrice(insurancePrice)}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between">
            <div className="text-base font-medium text-gray-900">
              Total mensual
            </div>
            <div className="text-lg font-bold text-primary-600">
              {formatPrice(totalPrice)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Incluido en tu alquiler:
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Acceso 24/7 con código digital
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Sistema de videovigilancia
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Cancelación sin permanencia
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Soporte técnico 24/7
          </li>
        </ul>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          * El precio se cargará mensualmente. Puedes cancelar en cualquier momento.
        </p>
        {includeInsurance && (
          <p className="mt-1">
            * El seguro cubre daños accidentales y robo hasta {formatPrice(INSURANCE_COVERAGE)}.
          </p>
        )}
      </div>
    </div>
  );
};