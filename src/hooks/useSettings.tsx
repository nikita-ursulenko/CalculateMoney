import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Settings {
  id: string;
  user_id: string;
  master_name: string;
  master_profession: string;
  use_different_rates: boolean;
  rate_general: number;
  rate_cash: number;
  rate_card: number;
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      const dataWithDefaults = data as any;
      setSettings({
        ...dataWithDefaults,
        master_profession: dataWithDefaults.master_profession || ''
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!user || !settings) return { error: new Error('No user or settings') };

    try {
      const { error } = await supabase
        .from('settings')
        .update(updates)
        .eq('user_id', user.id);

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
  }, [user]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
