import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWorkspace } from './useWorkspace';

export interface Settings {
  id: string;
  user_id: string;
  workspace_id: string;
  master_name: string;
  master_profession: string;
  use_different_rates: boolean;
  rate_general: number;
  rate_cash: number;
  rate_card: number;
}

export function useSettings() {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user || !activeWorkspace) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('settings')
        .select('*')
        .eq('workspace_id', activeWorkspace.workspace_id)
        .maybeSingle();

      if (error) throw error;
      const dataWithDefaults = data as any;
      setSettings({
        ...dataWithDefaults,
        master_profession: dataWithDefaults?.master_profession || ''
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!user || !settings || !activeWorkspace) return { error: new Error('No valid workspace, user, or settings') };

    try {
      const { error } = await (supabase as any)
        .from('settings')
        .update(updates)
        .eq('workspace_id', activeWorkspace.workspace_id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      return { error: null };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user, activeWorkspace?.workspace_id]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
