-- Migration: 20260225000000_create_workspaces.sql
-- Description: Create namespaces (salons) for multi-tenancy.

CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'master',
    manage_clients BOOLEAN NOT NULL DEFAULT false, -- Specific permission for masters
    is_default BOOLEAN NOT NULL DEFAULT false, -- Used to auto-select a workspace on login
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies
-- Users can view workspaces they are members of
CREATE POLICY "Users can view their workspaces" ON public.workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- Workspace owner can fully manage it
CREATE POLICY "Owners can manage workspaces" ON public.workspaces
    FOR ALL USING (auth.uid() = owner_id);

-- Workspace Members Policies
-- Users can view members of their workspaces
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Workspace admins or owners can manage members
CREATE POLICY "Admins can manage workspace members" ON public.workspace_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role = 'admin'
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_id
            AND w.owner_id = auth.uid()
        )
    );

-- Helper to update updated_at
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
