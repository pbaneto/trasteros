import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

export const CookieNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice about cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="bg-gray-900 bg-opacity-95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 text-sm text-gray-300">
              <p className="mb-2">
                <strong className="text-white">Información sobre cookies y datos personales</strong>
              </p>
              <p>
                Utilizamos cookies técnicas necesarias para el funcionamiento del sitio y para gestionar 
                su sesión. También procesamos datos personales para comunicaciones por WhatsApp Business 
                relacionadas con nuestros servicios (códigos de acceso, notificaciones de pago, etc.) 
                según nuestra base legal de ejecución de contrato.
              </p>
              <p className="mt-2">
                <Link 
                  to={ROUTES.PRIVACY} 
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Ver Política de Privacidad completa
                </Link>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 min-w-0 sm:min-w-fit">
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-md transition-colors"
              >
                Solo esenciales
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Acepto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};