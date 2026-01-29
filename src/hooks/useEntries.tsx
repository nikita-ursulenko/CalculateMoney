import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export interface Entry {
  id: string;
  user_id: string;
  date: string;
  service: string;
  price: number;
  tips: number;
  payment_method: 'cash' | 'card';
  tips_payment_method?: 'cash' | 'card';
  client_name: string;
  created_at: string;
  date_obj?: Date; // Optional helper
}

export interface NewEntry {
  service: string;
  price: number;
  tips: number;
  payment_method: 'cash' | 'card';
  tips_payment_method?: 'cash' | 'card';
  client_name: string;
  date: string;
}

export function useEntries(selectedDate?: Date | DateRange) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }) // Order by date first
        .order('created_at', { ascending: false });

      if (selectedDate) {
        if (selectedDate instanceof Date) {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          query = query.eq('date', dateStr);
        } else {
          // DateRange
          if (selectedDate.from) {
            const fromStr = format(selectedDate.from, 'yyyy-MM-dd');
            if (selectedDate.to) {
              const toStr = format(selectedDate.to, 'yyyy-MM-dd');
              query = query.gte('date', fromStr).lte('date', toStr);
            } else {
              // Only from date is selected, treat as single day
              query = query.eq('date', fromStr);
            }
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data as Entry[]) || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry: NewEntry) => {
    if (!user) return { error: new Error('No user') };

    try {
      const { error } = await supabase.from('entries').insert({
        ...entry,
        user_id: user.id,
      });

      if (error) throw error;

      await fetchEntries();
      return { error: null };
    } catch (error) {
      console.error('Error adding entry:', error);
      return { error };
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return { error: new Error('No user') };

    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(entries.filter(e => e.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting entry:', error);
      return { error };
    }
  };

  const updateEntry = async (id: string, updates: Partial<NewEntry>) => {
    if (!user) return { error: new Error('No user') };

    try {
      const { error } = await supabase
        .from('entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchEntries();
      return { error: null };
    } catch (error) {
      console.error('Error updating entry:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user, selectedDate]);

  return { entries, loading, addEntry, deleteEntry, updateEntry, refetch: fetchEntries };
}
