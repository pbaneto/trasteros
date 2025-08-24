import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { ROUTES, STORAGE_UNIT_SIZES } from '../utils/constants';
import { formatPrice } from '../utils/stripe';
import { useAuth } from '../contexts/AuthContext';
import { useStorageUnits } from '../hooks/useStorageUnits';
import { AuthModal, AuthMode } from '../components/auth/AuthModal';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading: unitsLoading } = useStorageUnits();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const openAuthModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
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

  const faqs = [
    {
      question: '¿Cómo funciona el acceso 24/7?',
      answer: 'Recibirás un código digital único que te permitirá acceder a tu trastero las 24 horas del día, los 7 días de la semana. Solo necesitas introducir tu código en el panel de acceso.'
    },
    {
      question: '¿Cuál es el plazo mínimo de alquiler?',
      answer: 'No tenemos permanencia mínima. Puedes alquilar tu trastero desde un mes y cancelar cuando necesites sin penalizaciones.'
    },
    {
      question: '¿Qué medidas de seguridad tienen?',
      answer: 'Contamos con videovigilancia 24/7, sistemas de alarma, cerraduras digitales individuales y personal de seguridad. Tus pertenencias están completamente protegidas.'
    },
    {
      question: '¿Puedo cambiar de tamaño de trastero?',
      answer: 'Sí, puedes cambiar a un trastero más grande o más pequeño según tu disponibilidad. Te ayudamos con el proceso de cambio sin complicaciones.'
    },
    {
      question: '¿Cómo se realiza el pago?',
      answer: 'Aceptamos pagos con tarjeta de crédito, débito y transferencia bancaria. El pago se realiza mensualmente de forma automática para tu comodidad.'
    }
  ];

  const sizes = [
    { 
      ...STORAGE_UNIT_SIZES.SMALL, 
      description: 'Perfecto para cajas y objetos pequeños',
    },
    { 
      ...STORAGE_UNIT_SIZES.MEDIUM, 
      description: 'Ideal para muebles y electrodomésticos',
    },
    { 
      ...STORAGE_UNIT_SIZES.LARGE, 
      description: 'Espacio amplio para mudanzas completas',
    },
    { 
      ...STORAGE_UNIT_SIZES.XLARGE, 
      description: 'Espacio amplio para mudanzas completas',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header onOpenAuth={openAuthModal} />

      {/* Hero Section - Full Width */}
      <div className="relative overflow-hidden min-h-screen flex items-center" style={{
        backgroundImage: "url('/images/home_background2.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <main className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
              <span className="block xl:inline">Trasteros en Las Rozas</span>{' '}
            </h1>
            <p className="mt-3 text-base text-blue-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
              Alquila tu trastero de forma rápida y sencilla. Acceso 24/7, 
              códigos digitales y la mejor seguridad para tus pertenencias.
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:justify-center">
              <div className="rounded-md shadow">
                <button
                  onClick={() => document.getElementById('sizes-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Alquila un trastero
                </button>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <button
                  onClick={() => user ? navigate(ROUTES.DASHBOARD) : openAuthModal('login')}
                  className="w-full flex items-center justify-center px-8 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-blue-600 hover:border-2 focus:outline-none focus:border focus:border-white active:border active:border-white md:py-4 md:text-lg md:px-10"
                >
                  Mis trasteros
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Sizes Section - Full Width */}
      <div id="sizes-section" className="bg-gray-50 py-12 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Elige el tamaño perfecto
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Tenemos el trastero ideal para cada necesidad
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {sizes.map((size) => (
              <div
                key={size.size}
                className="w-full max-w-sm mx-auto p-4 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-8 dark:bg-gray-800 dark:border-gray-700"
              >
                <h5 className="mb-4 text-xl font-medium text-gray-500 dark:text-gray-400">
                  {size.label}
                </h5>
                <div className="flex items-baseline text-gray-900 dark:text-white">
                  <span className="text-5xl font-extrabold tracking-tight">
                    {formatPrice(size.price).replace('€', '')}
                  </span>
                  <span className="ms-1 text-xl font-normal text-gray-500 dark:text-gray-400">
                    €/mes
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (user) {
                      navigate(`${ROUTES.DASHBOARD}?wizard=true&size=${size.size}`);
                    } else {
                      openAuthModal('login');
                    }
                  }}
                  disabled={unitsLoading}
                  className={`font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center ${
                    unitsLoading
                      ? 'text-gray-500 bg-gray-300 cursor-not-allowed'
                      : 'text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900'
                  }`}
                >
                  {unitsLoading 
                    ? 'Cargando...'
                    : 'Alquilar ahora'
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Features Section - Full Width */}
      <div className="py-12 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Todo lo que necesitas
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Nuestros trasteros satisfacen todas las necesidades de almacenamiento.
            </p>
          </div>

          {/* Use Cases Section */}
          <div className="mt-20">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {/* Family Storage */}
              <div className="group">
                <div className="relative overflow-hidden rounded-xl shadow-xl mb-8 transform transition-all duration-300 hover:scale-105">
                  <img 
                    src="/images/house2.jpg" 
                    alt="Almacenamiento familiar - muebles, juguetes y pertenencias del hogar"
                    className="w-full h-auto rounded-xl transition-transform duration-300 min-h-[20rem] max-h-[28rem] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                </div>
                <div className="text-center px-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Para Familias</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Perfecto para guardar muebles estacionales, juguetes, ropa, equipos deportivos y todo lo que necesita espacio extra en casa. Mantén tu hogar organizado y libre de desorden.
                  </p>
                </div>
              </div>

              {/* Business Storage */}
              <div className="group">
                <div className="relative overflow-hidden rounded-xl shadow-xl mb-8 transform transition-all duration-300 hover:scale-105">
                  <img 
                    src="/images/office1.png" 
                    alt="Almacenamiento empresarial - documentos, inventario y equipos de oficina"
                    className="w-full h-auto rounded-xl transition-transform duration-300 min-h-[20rem] max-h-[28rem] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                </div>
                <div className="text-center px-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Para Empresas</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Ideal para almacenar inventario, documentos importantes, equipos de oficina, material promocional y archivos. Solución flexible y segura para tu negocio.
                  </p>
                </div>
              </div>

              {/* Moving Storage */}
              <div className="group">
                <div className="relative overflow-hidden rounded-xl shadow-xl mb-8 transform transition-all duration-300 hover:scale-105">
                  <img 
                    src="/images/moving2.jpg" 
                    alt="Almacenamiento para mudanzas - cajas y muebles durante el traslado"
                    className="w-full h-auto rounded-xl transition-transform duration-300 min-h-[20rem] max-h-[28rem] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                </div>
                <div className="text-center px-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Para Mudanzas</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Solución temporal durante tu mudanza. Guarda tus pertenencias de forma segura mientras encuentras tu nuevo hogar o durante la transición entre propiedades.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Ventajas Section - Full Width */}
      <div className="py-16 bg-gray-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Ventajas
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Descubre por qué somos la mejor opción para tus necesidades de almacenamiento
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-500 text-white mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.name}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 bg-gray-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Resuelve tus dudas sobre nuestros trasteros
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg">
                <button 
                  className="flex justify-between items-center w-full p-5 text-left focus:ring-4 focus:ring-gray-200 hover:bg-gray-100"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <svg 
                    className={`w-3 h-3 shrink-0 transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 10 6"
                  >
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="p-5 border-t border-gray-200">
                    <p className="text-gray-500">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialMode={authMode}
      />
    </div>
  );
};