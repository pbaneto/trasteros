import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Company Info */}
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-xl font-bold text-white">Trasteros</span>
            </div>
            <p className="text-gray-300 text-base max-w-md">
              Soluciones de almacenamiento seguras y accesibles. 
              Alquila tu trastero de forma rápida y sencilla.
            </p>
          </div>
          
          {/* Navigation Links */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Servicios
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link to="/units" className="text-base text-gray-300 hover:text-white">
                      Trasteros Disponibles
                    </Link>
                  </li>
                  <li>
                    <Link to="/precios" className="text-base text-gray-300 hover:text-white">
                      Precios
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-300 hover:text-white">
                      Seguro
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-300 hover:text-white">
                      Acceso 24/7
                    </a>
                  </li>
                </ul>
              </div>

              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Empresa
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-gray-300 hover:text-white">
                      Sobre Nosotros
                    </a>
                  </li>
                  <li>
                    <Link to="/contacto" className="text-base text-gray-300 hover:text-white">
                      Contacto
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-300 hover:text-white">
                      Ubicaciones
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-300 hover:text-white">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Legal
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link to={ROUTES.PRIVACY} className="text-base text-gray-300 hover:text-white">
                      Política de Privacidad
                    </Link>
                  </li>
                  <li>
                    <Link to={ROUTES.CONDITIONS} className="text-base text-gray-300 hover:text-white">
                      Términos y Condiciones
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Soporte
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="tel:+34640723915" className="text-base text-gray-300 hover:text-white">
                      640 723 915
                    </a>
                  </li>
                  <li>
                    <a href="mailto:info@trasteros.com" className="text-base text-gray-300 hover:text-white">
                      info@trasteros.com
                    </a>
                  </li>
                  <li>
                    <span className="text-base text-gray-300">
                      Lun - Vie: 9:00 - 18:00
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; 2024 Trasteros. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};