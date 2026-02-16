-- Allow all authenticated users to view clients
CREATE POLICY "Anyone can view clients" ON public.clients
    FOR SELECT USING (auth.role() = 'authenticated');
