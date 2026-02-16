import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profession {
    id: string;
    name: string;
    created_at: string;
}

export function useProfessions() {
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProfessions = async () => {
        try {
            // @ts-ignore
            const { data, error } = await supabase
                .from('professions')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setProfessions(data || []);
        } catch (error) {
            console.error('Error fetching professions:', error);
            // Fallback for development if table not created yet
            setProfessions([]);
        } finally {
            setLoading(false);
        }
    };

    const addProfession = async (name: string) => {
        try {
            // @ts-ignore
            const { data, error } = await supabase
                .from('professions')
                .insert([{ name }])
                .select()
                .single();

            if (error) throw error;

            setProfessions(prev => [...prev, data as Profession].sort((a, b) => a.name.localeCompare(b.name)));
            return { data, error: null };
        } catch (error) {
            console.error('Error adding profession:', error);
            return { data: null, error };
        }
    };

    const deleteProfession = async (id: string) => {
        try {
            // @ts-ignore
            const { error } = await supabase
                .from('professions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProfessions(prev => prev.filter(p => p.id !== id));
            return { error: null };
        } catch (error) {
            console.error('Error deleting profession:', error);
            return { error };
        }
    };

    useEffect(() => {
        fetchProfessions();
    }, []);

    return {
        professions,
        loading,
        addProfession,
        deleteProfession,
        refetch: fetchProfessions
    };
}
