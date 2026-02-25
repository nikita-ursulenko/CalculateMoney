-- Create a trigger function to automatically create a default workspace for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- 1. Create a new personal workspace for the user
    INSERT INTO public.workspaces (name, owner_id)
    VALUES ('Мой салон', NEW.id)
    RETURNING id INTO new_workspace_id;

    -- 2. Add the user as an Admin to their new workspace
    INSERT INTO public.workspace_members (workspace_id, user_id, role, manage_clients, is_default)
    VALUES (new_workspace_id, NEW.id, 'admin', true, true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_workspace();
