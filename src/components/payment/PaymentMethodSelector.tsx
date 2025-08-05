import React, { useState } from 'react';
import { PaymentMethod } from '../../types';
import { PAYMENT_METHODS } from '../../utils/constants';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  savedMethods?: PaymentMethod[];
  onAddNewMethod?: () => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  savedMethods = [],
  onAddNewMethod,
}) => {
  const [showNewMethodForm, setShowNewMethodForm] = useState(false);

  const paymentOptions = [
    {
      id: PAYMENT_METHODS.CARD,
      name: 'Tarjeta de Crédito/Débito',
      description: 'Visa, Mastercard, American Express',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: PAYMENT_METHODS.GOOGLE_PAY,
      name: 'Google Pay',
      description: 'Pago rápido y seguro con Google',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
    },
    {
      id: PAYMENT_METHODS.PAYPAL,
      name: 'PayPal',
      description: 'Pago seguro con PayPal',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81c1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Método de Pago
      </h3>

      {/* Saved Payment Methods */}
      {savedMethods.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Métodos guardados
          </h4>
          {savedMethods.map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={(e) => onMethodChange(e.target.value)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <div className="text-gray-400 mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      •••• •••• •••• {method.last4}
                    </div>
                    <div className="text-sm text-gray-500">
                      {method.brand?.toUpperCase()} - Expira {method.expiryMonth}/{method.expiryYear}
                    </div>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* New Payment Methods */}
      <div className="space-y-3">
        {savedMethods.length > 0 && (
          <h4 className="text-sm font-medium text-gray-700">
            Nuevo método de pago
          </h4>
        )}
        
        {paymentOptions.map((option) => (
          <label
            key={option.id}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedMethod === option.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={option.id}
              checked={selectedMethod === option.id}
              onChange={(e) => onMethodChange(e.target.value)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <div className="text-gray-400 mr-3">
                  {option.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {option.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {option.description}
                  </div>
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div className="text-sm text-green-700">
            <p className="font-medium mb-1">Pago 100% seguro</p>
            <p>
              Tus datos de pago están protegidos con encriptación SSL de 256 bits y 
              cumplen con los estándares PCI DSS.
            </p>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-500">
        <p>
          Al continuar, aceptas nuestros{' '}
          <a href="#" className="text-primary-600 hover:text-primary-500">
            términos y condiciones
          </a>{' '}
          y{' '}
          <a href="#" className="text-primary-600 hover:text-primary-500">
            política de privacidad
          </a>.
        </p>
      </div>
    </div>
  );
};