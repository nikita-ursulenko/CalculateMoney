import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface DetailedWorkspaceMember {
    workspace_id: string;
    user_id: string;
    role: 'admin' | 'master';
    manage_clients: boolean;
    is_default: boolean;
    user?: {
        raw_user_meta_data?: {
            name?: string;
        };
        email?: string;
    };
    settings?: {
        master_name: string;
        master_profession: string;
    };
}

export function useWorkspaceMembers() {
    const { activeWorkspace, isAdmin } = useWorkspace();
    const [members, setMembers] = useState<DetailedWorkspaceMember[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMembers = async () => {
        if (!activeWorkspace || !isAdmin) {
            setMembers([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // We join the workspace_members with settings to get the master's name and profession
            const { data, error } = await (supabase as any)
                .from('workspace_members')
                .select(`
          *,
          settings(master_name, master_profession)
        `)
                .eq('workspace_id', activeWorkspace.workspace_id);

            if (error) throw error;
            setMembers(data as DetailedWorkspaceMember[]);
        } catch (error) {
            console.error('Error fetching workspace members:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateMemberPermissions = async (userId: string, updates: { role?: 'admin' | 'master', manage_clients?: boolean }) => {
        if (!activeWorkspace || !isAdmin) return { error: new Error('Unauthorized') };

        try {
            const { error } = await (supabase as any)
                .from('workspace_members')
                .update(updates)
                .eq('workspace_id', activeWorkspace.workspace_id)
                .eq('user_id', userId);

            if (error) throw error;
            await fetchMembers();
            return { error: null };
        } catch (error) {
            console.error('Error updating member:', error);
            return { error };
        }
    };

    const removeMember = async (userId: string) => {
        if (!activeWorkspace || !isAdmin) return { error: new Error('Unauthorized') };

        try {
            const { error } = await (supabase as any)
                .from('workspace_members')
                .delete()
                .eq('workspace_id', activeWorkspace.workspace_id)
                .eq('user_id', userId);

            if (error) throw error;
            await fetchMembers();
            return { error: null };
        } catch (error) {
            console.error('Error removing member:', error);
            return { error };
        }
    };

    const inviteMember = async (email: string) => {
        // In a real app we would use an edge function or secure invite flow here.
        // For this MVP, we simulate it by finding a user by email via a secure custom database function,
        // or simply rely on them registering first then adding them.
        // For now, this is a placeholder returning a not implemented error.
        return { error: new Error('Invitation flow requires server-level setup.') };
    }

    useEffect(() => {
        fetchMembers();
    }, [activeWorkspace?.workspace_id, isAdmin]);

    return { members, loading, updateMemberPermissions, removeMember, inviteMember };
}
