import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Entry, NewEntry } from './useEntries';

import { useWorkspace } from './useWorkspace';

export function useAdminEntries(selectedMasterId: string | null, selectedDate?: Date | DateRange) {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user || !selectedMasterId || !activeWorkspace) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      let query = (supabase as any)
        .from('entries')
        .select('*')
        .eq('workspace_id', activeWorkspace.workspace_id)
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
    if (!user || !activeWorkspace) return { error: new Error('No user or workspace') };

    try {
      const { error } = await (supabase as any).from('entries').insert({
        ...entry,
        user_id: masterId,
        workspace_id: activeWorkspace.workspace_id,
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
    if (!user || !activeWorkspace) return { error: new Error('No user or workspace') };

    try {
      const { error } = await (supabase as any)
        .from('entries')
        .delete()
        .eq('id', id)
        .eq('workspace_id', activeWorkspace.workspace_id);

      if (error) throw error;

      setEntries(entries.filter(e => e.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting entry:', error);
      return { error };
    }
  };

  const updateEntry = async (id: string, updates: Partial<NewEntry>) => {
    if (!user || !activeWorkspace) return { error: new Error('No user or workspace') };

    try {
      const { error } = await (supabase as any)
        .from('entries')
        .update(updates)
        .eq('id', id)
        .eq('workspace_id', activeWorkspace.workspace_id);

      if (error) throw error;

      await fetchEntries();
      return { error: null };
    } catch (error) {
      console.error('Error updating entry:', error);
      return { error };
    }
  };

  const checkOverlap = (date: string, startTime: string, endTime: string, excludeId?: string) => {
    if (!startTime || !endTime) return false;

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    return entries.some(entry => {
      if (entry.id === excludeId) return false;
      if (entry.date !== date) return false;
      if (!entry.start_time || !entry.end_time) return false;
      if (entry.transaction_type && entry.transaction_type !== 'service') return false;

      const existStart = toMinutes(entry.start_time);
      const existEnd = toMinutes(entry.end_time);

      return newStart < existEnd && newEnd > existStart;
    });
  };

  const dateDep = selectedDate instanceof Date
    ? selectedDate.getTime().toString()
    : `${(selectedDate as DateRange)?.from?.getTime() || 0}-${(selectedDate as DateRange)?.to?.getTime() || 0}`;

  useEffect(() => {
    fetchEntries();
  }, [user?.id, selectedMasterId, dateDep]);

  return { entries, loading, addEntry, deleteEntry, updateEntry, checkOverlap, refetch: fetchEntries };
}
