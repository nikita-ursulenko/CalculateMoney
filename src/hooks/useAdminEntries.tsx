import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Entry, NewEntry } from './useEntries';

export function useAdminEntries(selectedMasterId: string | null, selectedDate?: Date | DateRange) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user || !selectedMasterId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('entries')
        .select('*')
        .eq('user_id', selectedMasterId)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

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

  const addEntry = async (entry: NewEntry, masterId: string) => {
    if (!user) return { error: new Error('No user') };

    try {
      const { error } = await supabase.from('entries').insert({
        ...entry,
        user_id: masterId,
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
        .eq('id', id);

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
        .eq('id', id);

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
  }, [user, selectedMasterId, selectedDate]);

  return { entries, loading, addEntry, deleteEntry, updateEntry, refetch: fetchEntries };
}
