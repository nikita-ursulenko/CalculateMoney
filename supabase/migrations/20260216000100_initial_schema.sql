-- Consolidated Initial Schema Migration
-- Project: CalculateMoney
-- Date: 2026-02-16

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'master');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. TABLES

-- A. USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- B. SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    master_name TEXT NOT NULL DEFAULT '',
    use_different_rates BOOLEAN NOT NULL DEFAULT false,
    rate_general NUMERIC(5,2) NOT NULL DEFAULT 40,
    rate_cash NUMERIC(5,2) NOT NULL DEFAULT 40,
    rate_card NUMERIC(5,2) NOT NULL DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- C. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- D. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(name, user_id)
);

-- E. SERVICES
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    duration INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- F. ENTRIES
CREATE TABLE IF NOT EXISTS public.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    service TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    tips NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
    tips_payment_method TEXT CHECK (tips_payment_method IN ('cash', 'card')),
    client_name TEXT NOT NULL DEFAULT '',
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Future-proofing
    recipient_role TEXT CHECK (recipient_role IN ('me', 'master', 'admin')),
    recipient_name TEXT,
    transaction_type TEXT DEFAULT 'service' CHECK (transaction_type IN ('service', 'debt_salon_to_master', 'debt_master_to_salon')),
    start_time TEXT, -- HH:mm format
    end_time TEXT,   -- HH:mm format
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. SECURITY (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Helper function for Admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS POLICIES

-- User Roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.settings;
CREATE POLICY "Users can manage their own settings" ON public.settings FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all settings" ON public.settings;
CREATE POLICY "Admins can view all settings" ON public.settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Clients
DROP POLICY IF EXISTS "Users can manage their own clients" ON public.clients;
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all clients" ON public.clients FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Categories
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Services
DROP POLICY IF EXISTS "Users can manage their own services" ON public.services;
CREATE POLICY "Users can manage their own services" ON public.services FOR ALL USING (auth.uid() = user_id);

-- Entries
DROP POLICY IF EXISTS "Users can manage their own entries" ON public.entries;
CREATE POLICY "Users can manage their own entries" ON public.entries FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all entries" ON public.entries;
CREATE POLICY "Admins can view all entries" ON public.entries FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage any entries" ON public.entries;
CREATE POLICY "Admins can manage any entries" ON public.entries FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. TRIGGERS
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON public.entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_client_name ON public.entries(client_name);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
