import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';
import { UnitGrid } from '../components/storage/UnitGrid';
import { STORAGE_UNIT_SIZES } from '../utils/constants';

export const UnitsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSize, setSelectedSize] = useState<number | undefined>(
    searchParams.get('size') ? parseInt(searchParams.get('size')!) : undefined
  );
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);

  useEffect(() => {
    if (selectedSize) {
      setSearchParams({ size: selectedSize.toString() });
    } else {
      setSearchParams({});
    }
  }, [selectedSize, setSearchParams]);

  const sizeOptions = [
    { value: undefined, label: 'Todos los tamaños' },
    { value: STORAGE_UNIT_SIZES.SMALL.size, label: STORAGE_UNIT_SIZES.SMALL.label },
    { value: STORAGE_UNIT_SIZES.MEDIUM.size, label: STORAGE_UNIT_SIZES.MEDIUM.label },
    { value: STORAGE_UNIT_SIZES.LARGE.size, label: STORAGE_UNIT_SIZES.LARGE.label },
  ];

  return (
    <ResponsiveLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Trasteros Disponibles
          </h1>
          <p className="text-lg text-gray-600">
            Encuentra el trastero perfecto para tus necesidades. 
            Todos incluyen acceso 24/7 y código digital.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <label htmlFor="size-filter" className="text-sm font-medium text-gray-700">
                Tamaño:
              </label>
              <select
                id="size-filter"
                value={selectedSize || ''}
                onChange={(e) => setSelectedSize(e.target.value ? parseInt(e.target.value) : undefined)}
                className="input-field"
              >
                {sizeOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value || ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="available-only"
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="available-only" className="ml-2 text-sm text-gray-700">
                Solo mostrar disponibles
              </label>
            </div>
          </div>
        </div>

        {/* Units Grid */}
        <UnitGrid 
          filterBySize={selectedSize}
          showAvailableOnly={showAvailableOnly}
        />

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            ¿Necesitas ayuda para elegir?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">Trastero 2m²</h3>
              <ul className="space-y-1">
                <li>• 10-15 cajas medianas</li>
                <li>• Objetos pequeños</li>
                <li>• Documentos y archivos</li>
                <li>• Decoración estacional</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Trastero 4m²</h3>
              <ul className="space-y-1">
                <li>• Muebles de una habitación</li>
                <li>• Electrodomésticos</li>
                <li>• 20-30 cajas</li>
                <li>• Bicicletas y equipos deportivos</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Trastero 6m²</h3>
              <ul className="space-y-1">
                <li>• Contenido de un piso pequeño</li>
                <li>• Muebles grandes</li>
                <li>• 40-50 cajas</li>
                <li>• Ideal para mudanzas</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-blue-200">
            <p className="text-blue-700">
              ¿Tienes dudas sobre qué tamaño necesitas?{' '}
              <a href="tel:+34900000000" className="text-blue-600 hover:text-blue-500 font-medium">
                Llámanos al 900 000 000
              </a>{' '}
              y te ayudamos a elegir el trastero perfecto.
            </p>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
};