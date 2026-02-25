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

-- 1. Create helper functions that bypass RLS to prevent recursion
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_admin_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin';
$$;

-- Workspaces Policies
-- Users can view workspaces they are members of
CREATE POLICY "Users can view their workspaces" ON public.workspaces
    FOR SELECT USING (
        id IN (SELECT public.get_user_workspace_ids())
        OR owner_id = auth.uid()
    );

-- Workspace owner can fully manage it
CREATE POLICY "Owners can manage workspaces" ON public.workspaces
    FOR ALL USING (auth.uid() = owner_id);

-- Workspace Members Policies
-- Users can view members of their workspaces
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members
    FOR SELECT USING (
        user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids())
    );

-- Workspace admins or owners can manage members
CREATE POLICY "Admins can manage workspace members" ON public.workspace_members
    FOR ALL USING (
        workspace_id IN (SELECT public.get_user_admin_workspace_ids())
        OR 
        workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
    );

-- Helper to update updated_at
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
