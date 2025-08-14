import React, { useState } from 'react';
import { StorageUnit } from '../../types';
import { formatPrice } from '../../utils/stripe';
import { UNIT_PRICE, INSURANCE_PRICE, INSURANCE_COVERAGE } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

interface ReservationModalProps {
  unit: StorageUnit;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  unit,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const totalPrice = UNIT_PRICE + (includeInsurance ? INSURANCE_PRICE : 0);

  const handleProceed = () => {
    if (!user) {
      navigate(ROUTES.HOME);
      return;
    }

    // Store reservation data in sessionStorage for checkout
    sessionStorage.setItem('reservationData', JSON.stringify({
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      unitSize: unit.sizeM2,
      includeInsurance,
      price: UNIT_PRICE,
      insurancePrice: includeInsurance ? INSURANCE_PRICE : 0,
      totalPrice,
    }));

    navigate(ROUTES.CHECKOUT);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Reservar Trastero {unit.unitNumber}
                </h3>
                <div className="mt-4">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Tamaño:</span>
                      <span className="text-sm text-gray-900">{unit.sizeM2}m²</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Ubicación:</span>
                      <span className="text-sm text-gray-900">{unit.locationDescription}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Precio:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(UNIT_PRICE)}
                      </span>
                    </div>
                  </div>

                  {/* Insurance Option */}
                  <div className="mb-4">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={includeInsurance}
                        onChange={(e) => setIncludeInsurance(e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Seguro de contenido
                        </div>
                        <div className="text-sm text-gray-500">
                          Cobertura hasta {formatPrice(INSURANCE_COVERAGE)} por {formatPrice(INSURANCE_PRICE)}
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Incluye:</h4>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Acceso 24/7 con código digital
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Sistema de videovigilancia
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Cancelación sin permanencia
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
              onClick={handleProceed}
              className="w-full inline-flex justify-center btn-primary sm:ml-3 sm:w-auto"
            >
              {user ? 'Proceder al Pago' : 'Iniciar Sesión para Continuar'}
            </button>
            <button
              type="button"
              onClick={onClose}
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