-- Create professions table
CREATE TABLE IF NOT EXISTS public.professions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view professions
CREATE POLICY "Everyone can view professions" ON public.professions
    FOR SELECT TO authenticated
    USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage professions" ON public.professions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Seed initial data
INSERT INTO public.professions (name) VALUES
    ('Маникюр'),
    ('Педикюр'),
    ('Парикмахер'),
    ('Бровист'),
    ('Косметолог'),
    ('Массаж'),
    ('Lash-мейкер')
ON CONFLICT (name) DO NOTHING;
