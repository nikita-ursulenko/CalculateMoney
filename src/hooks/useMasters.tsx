import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export interface Master {
  user_id: string;
  master_name: string;
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
        const { data, error } = await supabase
          .from('settings')
          .select('user_id, master_name, rate_general, rate_cash, rate_card, use_different_rates')
          .order('master_name', { ascending: true });

        if (error) throw error;

        setMasters(data?.map(s => ({
          user_id: s.user_id,
          master_name: s.master_name || 'Без имени',
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
