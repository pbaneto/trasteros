import React, { useState, useEffect } from 'react';
import { StorageUnit } from '../../types';
import { UnitCard } from './UnitCard';
import { ReservationModal } from './ReservationModal';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-toastify';

interface UnitGridProps {
  filterBySize?: number;
  showAvailableOnly?: boolean;
}

export const UnitGrid: React.FC<UnitGridProps> = ({ 
  filterBySize, 
  showAvailableOnly = true 
}) => {
  const [units, setUnits] = useState<StorageUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, [filterBySize, showAvailableOnly]);

  const fetchUnits = async () => {
    try {
      let query = supabase
        .from('storage_units')
        .select('*')
        .order('unit_number');

      if (showAvailableOnly) {
        query = query.eq('status', 'available');
      }

      if (filterBySize) {
        query = query.eq('size_m2', filterBySize);
      }

      const { data, error } = await query;

      if (error) throw error;

      setUnits(data || []);
    } catch (error: any) {
      toast.error('Error al cargar las unidades de almacenamiento');
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = (unit: StorageUnit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const handleReservationComplete = () => {
    setIsModalOpen(false);
    setSelectedUnit(null);
    fetchUnits(); // Refresh units list
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="h-48 bg-gray-200 animate-pulse" />
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay trasteros disponibles
        </h3>
        <p className="text-gray-500">
          {filterBySize 
            ? `No se encontraron trasteros de ${filterBySize}m² disponibles en este momento.`
            : 'No hay trasteros disponibles en este momento. Por favor, inténtalo más tarde.'
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            onReserve={handleReserve}
          />
        ))}
      </div>

      {selectedUnit && (
        <ReservationModal
          unit={selectedUnit}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onComplete={handleReservationComplete}
        />
      )}
    </>
  );
};