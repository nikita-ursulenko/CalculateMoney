import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export interface Master {
  user_id: string;
  master_name: string;
  master_profession?: string;
  rate_general: number;
  rate_cash: number;
  rate_card: number;
  use_different_rates: boolean;
}

export function useMasters() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMasters = async () => {
      if (!user || !isAdmin) {
        setMasters([]);
        setLoading(false);
        return;
      }

      try {
        // Admin can see all settings (contains master info)
        // @ts-ignore
        const { data, error } = await supabase
          .from('settings')
          .select('user_id, master_name, master_profession, rate_general, rate_cash, rate_card, use_different_rates')
          .order('master_name', { ascending: true });

        if (error) throw error;

        // Filter out the admin themselves
        const filteredData = data?.filter(s => s.user_id !== user.id) || [];

        setMasters(filteredData.map(s => ({
          user_id: s.user_id,
          master_name: s.master_name || 'Без имени',
          master_profession: s.master_profession || '',
          rate_general: Number(s.rate_general),
          rate_cash: Number(s.rate_cash),
          rate_card: Number(s.rate_card),
          use_different_rates: s.use_different_rates,
        })) || []);
      } catch (error) {
        console.error('Error fetching masters:', error);
        setMasters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMasters();
  }, [user, isAdmin]);

  return { masters, loading };
}
