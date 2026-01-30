import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'master';

interface UserRoleState {
  role: AppRole | null;
  isAdmin: boolean;
  isMaster: boolean;
  loading: boolean;
}

export function useUserRole(): UserRoleState {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // логируем текущего пользователя перед запросом
        console.log('useUserRole: fetching role for user id =', user.id);

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        // логируем то, что пришло от Supabase
        console.log('useUserRole: fetch result', { data, error });

        // fallback на случай, если API вернул массив вместо объекта
        let resolvedRole: AppRole | null = null;
        if (data) {
          if (Array.isArray(data)) {
            resolvedRole = (data[0]?.role as AppRole) || null;
          } else {
            resolvedRole = (data.role as AppRole) || null;
          }
        }

        setRole(resolvedRole);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return {
    role,
    isAdmin: role === 'admin',
    isMaster: role === 'master' || role === null, // default to master behavior
    loading,
  };
}