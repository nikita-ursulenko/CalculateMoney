-- Allow all authenticated users to view categories and services
CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view services" ON public.services
    FOR SELECT USING (auth.role() = 'authenticated');
