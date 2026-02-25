import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWorkspace } from './useWorkspace';

export interface Client {
    id: string;
    user_id: string;
    name: string;
    phone: string | null;
    description: string | null;
    created_at: string;
    // Computed fields for UI
    lastVisit?: string;
    totalSpent?: number;
    visitCount?: number;
    master_revenue_share?: number | null;
}

export interface NewClient {
    name: string;
    phone?: string;
    description?: string;
    master_revenue_share?: number | null;
}

export function useClients() {
    const { user } = useAuth();
    const { activeWorkspace } = useWorkspace();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchClients = async () => {
        if (!user) {
            setClients([]);
            setLoading(false);
            return;
        }

        try {
            // In a real app we might want to aggregate stats here, 
            // but for now we'll just fetch the clients.
            const { data, error } = await (supabase as any)
                .from('clients')
                .select('*')
                .eq('workspace_id', activeWorkspace.workspace_id)
                .order('name', { ascending: true });

            if (error) throw error;

            // Type cast to prevent "Type instantiation is excessively deep" errors from recursive foreign keys
            const rawClients = (data as unknown) as Client[];

            // For now, visits stats would be mock or calculated client-side 
            // if we don't have a complex join/view.
            setClients(rawClients || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const addClient = async (client: NewClient) => {
        if (!user || !activeWorkspace) return { error: new Error('No valid workspace or user'), data: null };

        try {
            const { data, error } = await (supabase as any)
                .from('clients')
                .insert({
                    ...client,
                    user_id: user.id,
                    workspace_id: activeWorkspace.workspace_id
                })
                .select()
                .single();

            if (error) throw error;

            await fetchClients();
            return { error: null, data };
        } catch (error) {
            console.error('Error adding client:', error);
            return { error, data: null };
        }
    };

    const updateClient = async (id: string, updates: Partial<NewClient>) => {
        if (!user || !activeWorkspace) return { error: new Error('No valid workspace or user') };

        try {
            const { error } = await (supabase as any)
                .from('clients')
                .update(updates)
                .eq('id', id)
                .eq('workspace_id', activeWorkspace.workspace_id);

            if (error) throw error;

            await fetchClients();
            return { error: null };
        } catch (error) {
            console.error('Error updating client:', error);
            return { error };
        }
    };

    const deleteClient = async (id: string) => {
        if (!user || !activeWorkspace) return { error: new Error('No valid workspace or user') };

        try {
            const { error } = await (supabase as any)
                .from('clients')
                .delete()
                .eq('id', id)
                .eq('workspace_id', activeWorkspace.workspace_id);

            if (error) throw error;

            setClients(clients.filter(c => c.id !== id));
            return { error: null };
        } catch (error) {
            console.error('Error deleting client:', error);
            return { error };
        }
    };

    useEffect(() => {
        fetchClients();
    }, [user, activeWorkspace?.workspace_id]);

    return { clients, loading, addClient, updateClient, deleteClient, refetch: fetchClients };
}
