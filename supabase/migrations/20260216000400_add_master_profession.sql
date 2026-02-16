-- Add master_profession to settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS master_profession TEXT DEFAULT '';
