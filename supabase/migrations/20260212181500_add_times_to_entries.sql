-- Add start_time and end_time columns to the entries table
ALTER TABLE public.entries 
ADD COLUMN start_time TEXT,
ADD COLUMN end_time TEXT;

-- Update existing records to have a default time if needed, 
-- or leave as NULL if that's preferred. For now, let's keep them nullable.
