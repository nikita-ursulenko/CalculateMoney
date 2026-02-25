-- Purpose: Securely lookup a user by email and add them to a workspace if they exist.
-- This function must run with SECURITY DEFINER to bypass RLS on auth.users for lookup.
CREATE OR REPLACE FUNCTION invite_user_by_email(target_email TEXT, ws_id UUID, new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    is_admin BOOLEAN;
BEGIN
    -- 1. Check if the current caller is an admin of the target workspace
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
        AND role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE id = ws_id
        AND owner_id = auth.uid()
    ) INTO is_admin;

    IF NOT is_admin THEN
        RETURN jsonb_build_object('error', 'Unauthorized: Only admins can invite users.');
    END IF;

    -- 2. Lookup the user ID by email in auth.users (requires SECURITY DEFINER)
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'User with this email not found. They must register first.');
    END IF;

    -- 3. Check if they are already in the workspace
    IF EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_id AND user_id = target_user_id) THEN
        RETURN jsonb_build_object('error', 'User is already a member of this salon.');
    END IF;

    -- 4. Add them to the workspace
    INSERT INTO public.workspace_members (workspace_id, user_id, role, manage_clients, is_default)
    VALUES (ws_id, target_user_id, new_role, false, false);

    RETURN jsonb_build_object('success', true);
END;
$$;
