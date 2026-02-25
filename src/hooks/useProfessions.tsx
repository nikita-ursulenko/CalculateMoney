import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface Profession {
    id: string;
    name: string;
    workspace_id: string;
    created_at: string;
}

export function useProfessions() {
    const { activeWorkspace } = useWorkspace();
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProfessions = async () => {
        if (!activeWorkspace?.workspace_id) {
            setProfessions([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await (supabase as any)
                .from('professions')
                .select('*')
                .eq('workspace_id', activeWorkspace.workspace_id)
                .order('name', { ascending: true });

            if (error) throw error;
            setProfessions((data as any) || []);
        } catch (error) {
            console.error('Error fetching professions:', error);
            setProfessions([]);
        } finally {
            setLoading(false);
        }
    };

    const addProfession = async (name: string) => {
        if (!activeWorkspace?.workspace_id) return { data: null, error: new Error('No workspace') };

        try {
            const { data, error } = await (supabase as any)
                .from('professions')
                .insert([{ name, workspace_id: activeWorkspace.workspace_id }])
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
            const { error } = await (supabase as any)
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
    }, [activeWorkspace?.workspace_id]);

    return {
        professions,
        loading,
        addProfession,
        deleteProfession,
        refetch: fetchProfessions
    };
}
