import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { StorageUnit } from '../types';
import { transformStorageUnits } from '../utils/mappers';

interface StorageUnitAvailability {
  size: number;
  availableCount: number;
  totalCount: number;
}

export const useStorageUnits = () => {
  const [storageUnits, setStorageUnits] = useState<StorageUnit[]>([]);
  const [availability, setAvailability] = useState<StorageUnitAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStorageUnits = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching storage units...');
        
        const { data, error } = await supabase
          .from('storage_units')
          .select('*')
          .order('size_m2');

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        const transformedUnits = transformStorageUnits(data || []);
        setStorageUnits(transformedUnits);

        // Calculate availability by size
        const availabilityBySize = [2, 3, 5, 6].map(size => {
          const unitsOfSize = transformedUnits.filter(unit => unit.sizeM2 === size);
          const availableUnits = unitsOfSize.filter(unit => unit.status === 'available');
          
          return {
            size,
            availableCount: availableUnits.length,
            totalCount: unitsOfSize.length,
          };
        });

        console.log('Calculated availability:', availabilityBySize);
        setAvailability(availabilityBySize);
      } catch (err) {
        console.error('Error in fetchStorageUnits:', err);
        setError(err instanceof Error ? err.message : 'Error fetching storage units');
        // Set default availability even on error to prevent infinite loading
        setAvailability([
          { size: 2, availableCount: 0, totalCount: 0 },
          { size: 4, availableCount: 0, totalCount: 0 },
          { size: 6, availableCount: 0, totalCount: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageUnits();
  }, []);

  return { storageUnits, availability, loading, error };
};