import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'master';

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
    is_default: boolean;
    workspace: Workspace;
}

interface WorkspaceContextType {
    workspaces: WorkspaceMember[];
    activeWorkspace: WorkspaceMember | null;
    setActiveWorkspace: (workspaceId: string) => void;
    loading: boolean;
    refreshWorkspaces: () => Promise<void>;

    // Helpers for current context
    isAdmin: boolean;
    canManageClients: boolean;
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
                // Did we already have one selected? Keep it if it's still valid
                const stillValid = activeWorkspace && typedData.find(w => w.workspace_id === activeWorkspace.workspace_id);

                if (stillValid) {
                    // Update it in case permissions changed
                    setActiveWorkspaceState(stillValid);
                } else {
                    // Try to find the default one, otherwise just pick the first one
                    const defaultWs = typedData.find(w => w.is_default);
                    setActiveWorkspaceState(defaultWs || typedData[0]);
                }
            } else {
                setActiveWorkspaceState(null);
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
            // Optional: Save preference to localStorage or API
        }
    };

    // Derive permissions for the CURRENT workspace
    const isAdmin = activeWorkspace?.role === 'admin' || activeWorkspace?.workspace.owner_id === user?.id;
    const canManageClients = isAdmin || activeWorkspace?.manage_clients === true;

    const value = {
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        loading,
        refreshWorkspaces: fetchWorkspaces,
        isAdmin,
        canManageClients
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
