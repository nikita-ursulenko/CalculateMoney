-- Migration: 20260225000100_add_workspace_to_entities.sql
-- Description: Add workspace_id to all main tables and update RLS policies, plus migrate existing data.

-- 1. Add workspace_id columns
ALTER TABLE public.clients ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.entries ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.settings ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 2. Data Migration: Create default workspaces for existing users
DO $$ 
DECLARE
    u_id UUID;
    w_id UUID;
BEGIN
    FOR u_id IN SELECT id FROM auth.users LOOP
        -- Create a personal workspace
        INSERT INTO public.workspaces (name, owner_id)
        VALUES ('Личный кабинет', u_id)
        RETURNING id INTO w_id;

        -- Add user as owner/admin of their workspace
        INSERT INTO public.workspace_members (workspace_id, user_id, role, manage_clients, is_default)
        VALUES (w_id, u_id, 'admin', true, true);

        -- Update existing data to point to this new workspace
        UPDATE public.clients SET workspace_id = w_id WHERE user_id = u_id;
        UPDATE public.categories SET workspace_id = w_id WHERE user_id = u_id;
        UPDATE public.services SET workspace_id = w_id WHERE user_id = u_id;
        UPDATE public.entries SET workspace_id = w_id WHERE user_id = u_id;
        UPDATE public.settings SET workspace_id = w_id WHERE user_id = u_id;
    END LOOP;
END $$;

-- 3. Make workspace_id NOT NULL after migration
ALTER TABLE public.clients ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.entries ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.settings ALTER COLUMN workspace_id SET NOT NULL;

-- 4. Update RLS Policies to use workspaces instead of just user_id

-- Helper function to check if user has access to a workspace
CREATE OR REPLACE FUNCTION public.has_workspace_access(_workspace_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id
    AND user_id = auth.uid()
  )
$$;

-- Helper function to check if user is admin in a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin(_workspace_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = _workspace_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
    OR EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE id = _workspace_id
        AND owner_id = auth.uid()
    )
$$;

-- Helper function to check if user can manage clients in a workspace
CREATE OR REPLACE FUNCTION public.can_manage_clients(_workspace_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = _workspace_id
        AND user_id = auth.uid()
        AND (role = 'admin' OR manage_clients = true)
    )
    OR EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE id = _workspace_id
        AND owner_id = auth.uid()
    )
$$;


-- Clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can manage all clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can view clients" ON public.clients;

CREATE POLICY "Workspace members can view clients" ON public.clients
    FOR SELECT USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Authorized members can insert clients" ON public.clients
    FOR INSERT WITH CHECK (public.can_manage_clients(workspace_id));

CREATE POLICY "Authorized members can update clients" ON public.clients
    FOR UPDATE USING (public.can_manage_clients(workspace_id));

CREATE POLICY "Authorized members can delete clients" ON public.clients
    FOR DELETE USING (public.can_manage_clients(workspace_id));


-- Categories
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Workspace members can view categories" ON public.categories
    FOR SELECT USING (public.has_workspace_access(workspace_id));
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_workspace_admin(workspace_id));


-- Services
DROP POLICY IF EXISTS "Users can manage their own services" ON public.services;
CREATE POLICY "Workspace members can view services" ON public.services
    FOR SELECT USING (public.has_workspace_access(workspace_id));
CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL USING (public.is_workspace_admin(workspace_id));


-- Entries
DROP POLICY IF EXISTS "Users can manage their own entries" ON public.entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON public.entries;
DROP POLICY IF EXISTS "Admins can manage any entries" ON public.entries;

-- Everyone in the workspace can view entries, but maybe only their own unless admin?
-- For now, let's say: admins see all, masters see only their own entries in that workspace.
CREATE POLICY "View entries" ON public.entries
    FOR SELECT USING (
        public.is_workspace_admin(workspace_id) 
        OR (public.has_workspace_access(workspace_id) AND user_id = auth.uid())
    );

CREATE POLICY "Insert entries" ON public.entries
    FOR INSERT WITH CHECK (
        public.is_workspace_admin(workspace_id) 
        OR (public.has_workspace_access(workspace_id) AND user_id = auth.uid())
    );

CREATE POLICY "Update entries" ON public.entries
    FOR UPDATE USING (
        public.is_workspace_admin(workspace_id) 
        OR (public.has_workspace_access(workspace_id) AND user_id = auth.uid())
    );

CREATE POLICY "Delete entries" ON public.entries
    FOR DELETE USING (
        public.is_workspace_admin(workspace_id) 
        OR (public.has_workspace_access(workspace_id) AND user_id = auth.uid())
    );


-- Settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can view all settings" ON public.settings;

CREATE POLICY "Users manage their workspace settings" ON public.settings
    FOR ALL USING (
        user_id = auth.uid() 
        AND public.has_workspace_access(workspace_id)
    );
