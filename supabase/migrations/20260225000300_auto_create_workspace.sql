-- This migration file previously created an auto-workspace trigger for new users.
-- The trigger has been REMOVED because the onboarding screen in the frontend
-- now handles workspace creation with user intent (Admin vs waiting for invite).
--
-- Keeping this file so the migration history is not broken.
-- The function is kept but the trigger itself was dropped.

CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER AS $$
BEGIN
    -- Trigger intentionally disabled. Workspace is created via OnboardingScreen UI.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger is NOT created here. Kept as a reference only.
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
