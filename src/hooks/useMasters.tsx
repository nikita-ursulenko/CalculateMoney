import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWorkspace } from './useWorkspace';

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
  const { isAdmin, activeWorkspace } = useWorkspace();
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMasters = async () => {
      if (!user || !isAdmin || !activeWorkspace) {
        setMasters([]);
        setLoading(false);
        return;
      }

      try {
        // Step 1: fetch workspace members with role master or moderator
        const { data: memberData, error: memberError } = await (supabase as any)
          .from('workspace_members')
          .select('user_id, role')
          .eq('workspace_id', activeWorkspace.workspace_id)
          .in('role', ['master', 'moderator']);

        if (memberError) throw memberError;
        if (!memberData || memberData.length === 0) {
          setMasters([]);
          setLoading(false);
          return;
        }

        const userIds = memberData.map((m: any) => m.user_id);

        // Step 2: fetch settings for those user IDs (admin RLS policy allows this)
        const { data: settingsData, error: settingsError } = await (supabase as any)
          .from('settings')
          .select('user_id, master_name, master_profession, rate_general, rate_cash, rate_card, use_different_rates')
          .eq('workspace_id', activeWorkspace.workspace_id)
          .in('user_id', userIds);

        if (settingsError) throw settingsError;

        const settingsMap = (settingsData as any[] || []).reduce((acc: any, s: any) => {
          acc[s.user_id] = s;
          return acc;
        }, {});

        setMasters(memberData.map((member: any) => {
          const s = settingsMap[member.user_id] || {};
          return {
            user_id: member.user_id,
            master_name: s.master_name || 'Без имени',
            master_profession: s.master_profession || '',
            rate_general: Number(s.rate_general ?? 40),
            rate_cash: Number(s.rate_cash ?? 40),
            rate_card: Number(s.rate_card ?? 40),
            use_different_rates: s.use_different_rates ?? false,
          };
        }));
      } catch (error) {
        console.error('Error fetching masters:', error);
        setMasters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMasters();
  }, [user, isAdmin, activeWorkspace?.workspace_id]);

  return { masters, loading };
}
