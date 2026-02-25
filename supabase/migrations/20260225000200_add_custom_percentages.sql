-- Migration: 20260225000200_add_custom_percentages.sql
-- Description: Add master_revenue_share column to clients and entries for individual percentage tracking.

ALTER TABLE public.clients ADD COLUMN master_revenue_share NUMERIC(5,2) DEFAULT NULL;
ALTER TABLE public.entries ADD COLUMN master_revenue_share NUMERIC(5,2) DEFAULT NULL;
