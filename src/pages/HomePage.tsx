import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';
import { ROUTES, UNIT_PRICE, STORAGE_UNIT_SIZES } from '../utils/constants';
import { formatPrice } from '../utils/stripe';
import { useAuth } from '../contexts/AuthContext';
import { useStorageUnits } from '../hooks/useStorageUnits';
import { AuthModal, AuthMode } from '../components/auth/AuthModal';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { availability, loading: unitsLoading, error: unitsError } = useStorageUnits();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const openAuthModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const features = [
    {
      name: 'Acceso 24/7',
      description: 'Accede a tu trastero cuando necesites, las 24 horas del día.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Código Digital',
      description: 'Acceso mediante código digital.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Videovigilancia',
      description: 'Instalaciones monitoreadas 24/7 para tu tranquilidad.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Sin Permanencia',
      description: 'Cancela tu alquiler cuando quieras, sin compromisos.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const sizes = [
    { 
      ...STORAGE_UNIT_SIZES.SMALL, 
      description: 'Perfecto para cajas y objetos pequeños',
      availability: availability.find(a => a.size === 2)
    },
    { 
      ...STORAGE_UNIT_SIZES.MEDIUM, 
      description: 'Ideal para muebles y electrodomésticos',
      availability: availability.find(a => a.size === 4)
    },
    { 
      ...STORAGE_UNIT_SIZES.LARGE, 
      description: 'Espacio amplio para mudanzas completas',
      availability: availability.find(a => a.size === 6)
    },
  ];

  return (
    <ResponsiveLayout onOpenAuth={openAuthModal}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Almacenamiento</span>{' '}
                <span className="block xl:inline">seguro y accesible</span>
              </h1>
              <p className="mt-3 text-base text-primary-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
                Alquila tu trastero de forma rápida y sencilla. Acceso 24/7, 
                códigos digitales y la mejor seguridad para tus pertenencias.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center">
                <div className="rounded-md shadow">
                  <button
                    onClick={() => document.getElementById('sizes-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    Alquila un trastero
                  </button>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <button
                    onClick={() => user ? navigate(ROUTES.DASHBOARD) : openAuthModal('login')}
                    className="w-full flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-primary-600 md:py-4 md:text-lg md:px-10"
                  >
                    Mis trasteros
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              Características
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Todo lo que necesitas
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Nuestros trasteros incluyen todas las comodidades para que guardes 
              tus pertenencias con total tranquilidad.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <div key={feature.name} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      {feature.icon}
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      {feature.name}
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Sizes Section */}
      <div id="sizes-section" className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Elige el tamaño perfecto
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Tenemos el trastero ideal para cada necesidad
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {sizes.map((size) => (
              <div
                key={size.size}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 px-6 py-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-primary-600 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">{size.size}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {size.label}
                    </h3>
                    <p className="text-gray-600">{size.description}</p>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-primary-600">
                      {formatPrice(UNIT_PRICE)}
                    </div>
                    <div className="text-gray-500">pago único</div>
                  </div>

                  {/* Availability info */}
                  <div className="text-center mb-4">
                    {unitsLoading ? (
                      <div className="text-gray-500">Cargando disponibilidad...</div>
                    ) : unitsError ? (
                      <div className="text-red-500 text-sm">Error cargando disponibilidad</div>
                    ) : size.availability ? (
                      <div className={`text-sm font-medium ${
                        size.availability.availableCount > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {size.availability.availableCount > 0 
                          ? `${size.availability.availableCount} disponibles`
                          : 'No disponible'
                        }
                      </div>
                    ) : (
                      <div className="text-gray-500">-</div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (user) {
                        navigate(`${ROUTES.CHECKOUT}?size=${size.size}`);
                      } else {
                        openAuthModal('login');
                      }
                    }}
                    disabled={unitsLoading || (size.availability && size.availability.availableCount === 0)}
                    className={`w-full text-center px-4 py-3 rounded-md font-medium transition-colors ${
                      unitsLoading || (size.availability && size.availability.availableCount === 0)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {unitsLoading 
                      ? 'Cargando...'
                      : size.availability && size.availability.availableCount === 0
                        ? 'No Disponible'
                        : 'Reservar Ahora'
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialMode={authMode}
      />
    </ResponsiveLayout>
  );
};