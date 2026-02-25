import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface DetailedWorkspaceMember {
    workspace_id: string;
    user_id: string;
    role: 'admin' | 'moderator' | 'master';
    manage_clients: boolean;
    manage_entries: boolean;
    view_admin_calendar: boolean;
    manage_services: boolean;
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
        use_different_rates?: boolean;
        rate_general?: number;
        rate_cash?: number;
        rate_card?: number;
        percent_type?: 'global' | 'individual';
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

            // Step 1: fetch all workspace members
            const { data: memberData, error: memberError } = await (supabase as any)
                .from('workspace_members')
                .select('*')
                .eq('workspace_id', activeWorkspace.workspace_id);

            if (memberError) throw memberError;
            if (!memberData?.length) {
                setMembers([]);
                setLoading(false);
                return;
            }

            // Step 2: fetch settings for all those users in this workspace
            // The new admin RLS policy allows this
            const userIds = memberData.map((m: any) => m.user_id);
            const { data: settingsData } = await (supabase as any)
                .from('settings')
                .select('user_id, master_name, master_profession, rate_general, rate_cash, rate_card, percent_type, use_different_rates')
                .eq('workspace_id', activeWorkspace.workspace_id)
                .in('user_id', userIds);

            // Merge members with their settings
            const settingsMap: Record<string, any> = {};
            (settingsData || []).forEach((s: any) => { settingsMap[s.user_id] = s; });

            const merged = memberData.map((m: any) => ({
                ...m,
                settings: settingsMap[m.user_id] || null,
            }));

            setMembers(merged as DetailedWorkspaceMember[]);
        } catch (error) {
            console.error('Error fetching workspace members:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateMemberPermissions = async (userId: string, updates: {
        role?: 'admin' | 'moderator' | 'master';
        manage_clients?: boolean;
        manage_entries?: boolean;
        view_admin_calendar?: boolean;
        manage_services?: boolean;
    }) => {
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

    const inviteMember = async (email: string, role: 'admin' | 'master' = 'master') => {
        if (!activeWorkspace || !isAdmin) return { error: new Error('Unauthorized') };

        try {
            const { data, error } = await (supabase as any).rpc('invite_user_by_email', {
                target_email: email,
                ws_id: activeWorkspace.workspace_id,
                new_role: role
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            await fetchMembers();
            return { error: null };
        } catch (error) {
            console.error('Error inviting member:', error);
            return { error };
        }
    };

    const updateMemberSettings = async (userId: string, updates: any) => {
        if (!activeWorkspace || !isAdmin) return { error: new Error('Unauthorized') };

        try {
            // Check if settings row exists first
            const { data: existing } = await (supabase as any)
                .from('settings')
                .select('id')
                .eq('workspace_id', activeWorkspace.workspace_id)
                .eq('user_id', userId)
                .maybeSingle();

            let error;
            if (existing) {
                const res = await (supabase as any)
                    .from('settings')
                    .update(updates)
                    .eq('workspace_id', activeWorkspace.workspace_id)
                    .eq('user_id', userId);
                error = res.error;
            } else {
                const res = await (supabase as any)
                    .from('settings')
                    .insert({
                        ...updates,
                        workspace_id: activeWorkspace.workspace_id,
                        user_id: userId
                    });
                error = res.error;
            }

            if (error) throw error;
            await fetchMembers();
            return { error: null };
        } catch (error) {
            console.error('Error updating member settings:', error);
            return { error };
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [activeWorkspace?.workspace_id, isAdmin]);

    return { members, loading, updateMemberPermissions, removeMember, inviteMember, updateMemberSettings };
}
