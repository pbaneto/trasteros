import React from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';
import { ROUTES, MONTHLY_PRICE, STORAGE_UNIT_SIZES } from '../utils/constants';
import { formatPrice } from '../utils/stripe';

export const HomePage: React.FC = () => {
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
      description: 'Acceso mediante código digital o QR desde tu móvil.',
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
    { ...STORAGE_UNIT_SIZES.SMALL, description: 'Perfecto para cajas y objetos pequeños' },
    { ...STORAGE_UNIT_SIZES.MEDIUM, description: 'Ideal para muebles y electrodomésticos' },
    { ...STORAGE_UNIT_SIZES.LARGE, description: 'Espacio amplio para mudanzas completas' },
  ];

  return (
    <ResponsiveLayout>
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Almacenamiento</span>{' '}
                  <span className="block text-primary-600 xl:inline">seguro y accesible</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Alquila tu trastero de forma rápida y sencilla. Acceso 24/7, 
                  códigos digitales y la mejor seguridad para tus pertenencias.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <button
                      onClick={() => document.getElementById('sizes-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                    >
                      Ver Trasteros Disponibles
                    </button>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button
                      onClick={() => document.getElementById('sizes-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                    >
                      Ver Precios
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-br from-primary-400 to-primary-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 mx-auto bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Desde {formatPrice(MONTHLY_PRICE)}/mes</h3>
              <p className="text-primary-100">Sin permanencia • Acceso 24/7</p>
            </div>
          </div>
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
                      {formatPrice(MONTHLY_PRICE)}
                    </div>
                    <div className="text-gray-500">por mes</div>
                  </div>

                  <Link
                    to={ROUTES.DASHBOARD}
                    className="w-full btn-primary text-center"
                  >
                    Reservar Ahora
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </ResponsiveLayout>
  );
};