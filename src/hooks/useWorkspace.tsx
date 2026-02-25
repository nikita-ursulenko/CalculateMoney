import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'moderator' | 'master';

export interface Workspace {
    id: string;
    name: string;
    owner_id: string;
}

export interface WorkspaceMember {
    workspace_id: string;
    user_id: string;
    role: AppRole;
    manage_clients: boolean;
    manage_entries: boolean;
    view_admin_calendar: boolean;
    manage_services: boolean;
    is_default: boolean;
    workspace: Workspace;
}

interface WorkspaceContextType {
    workspaces: WorkspaceMember[];
    activeWorkspace: WorkspaceMember | null;
    setActiveWorkspace: (workspaceId: string) => void;
    loading: boolean;
    refreshWorkspaces: () => Promise<void>;

    // Derived permission helpers
    isAdmin: boolean;
    isModerator: boolean;
    canManageClients: boolean;
    canManageEntries: boolean;
    canViewAdminCalendar: boolean;
    canManageServices: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState<WorkspaceMember[]>([]);
    const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceMember | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWorkspaces = async () => {
        if (!user) {
            setWorkspaces([]);
            setActiveWorkspaceState(null);
            setLoading(false);
            return;
        }

        try {
            // Fetch all workspaces the user is a member of
            const { data, error } = await supabase
                .from('workspace_members')
                .select(`
          workspace_id,
          user_id,
          role,
          manage_clients,
          manage_entries,
          view_admin_calendar,
          manage_services,
          is_default,
          workspace:workspaces (
            id,
            name,
            owner_id
          )
        `)
                .eq('user_id', user.id);

            if (error) throw error;

            // Type assertion because Supabase returns generic types for foreign keys
            const typedData = (data as unknown) as WorkspaceMember[];
            setWorkspaces(typedData || []);

            // Determine active workspace
            if (typedData && typedData.length > 0) {
                // Read from localStorage first
                const savedId = localStorage.getItem('calculateMoney_activeWsId');
                let selected = null;

                // Did we already have one selected? Keep it if it's still valid
                if (activeWorkspace) {
                    selected = typedData.find(w => w.workspace_id === activeWorkspace.workspace_id) || null;
                }

                // If not, try localStorage
                if (!selected && savedId) {
                    selected = typedData.find(w => w.workspace_id === savedId) || null;
                }

                // If still not found, try default or first
                if (!selected) {
                    selected = typedData.find(w => w.is_default) || typedData[0];
                }

                if (selected) {
                    setActiveWorkspaceState(selected);
                    localStorage.setItem('calculateMoney_activeWsId', selected.workspace_id);
                }
            } else {
                // No workspaces: user is either a new master waiting for invite
                // or a new admin who hasn't set up their salon yet.
                // Show the onboarding screen — do NOT auto-create anything.
                setActiveWorkspaceState(null);
                localStorage.removeItem('calculateMoney_activeWsId');
            }
        } catch (error) {
            console.error('Error fetching workspaces:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, [user]);

    const setActiveWorkspace = (workspaceId: string) => {
        const ws = workspaces.find(w => w.workspace_id === workspaceId);
        if (ws) {
            setActiveWorkspaceState(ws);
            localStorage.setItem('calculateMoney_activeWsId', ws.workspace_id);
        }
    };

    // Derive permissions for the CURRENT workspace
    const isAdmin = activeWorkspace?.role === 'admin' || activeWorkspace?.workspace.owner_id === user?.id;
    const isModerator = !isAdmin && activeWorkspace?.role === 'moderator';
    const canManageClients = isAdmin || isModerator || activeWorkspace?.manage_clients === true;
    const canManageEntries = isAdmin || activeWorkspace?.manage_entries === true;
    const canViewAdminCalendar = isAdmin || activeWorkspace?.view_admin_calendar === true;
    const canManageServices = isAdmin || activeWorkspace?.manage_services === true;

    const value = {
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        loading,
        refreshWorkspaces: fetchWorkspaces,
        isAdmin,
        isModerator,
        canManageClients,
        canManageEntries,
        canViewAdminCalendar,
        canManageServices,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}
