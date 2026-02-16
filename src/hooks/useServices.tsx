import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Service {
    id: string;
    name: string;
    price: number;
    duration?: number;
    category_id: string | null;
    category?: string; // Virtual field for UI
}

export interface Category {
    id: string;
    name: string;
}

export function useServices(ownerId?: string) {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const targetUserId = ownerId || user?.id;

    const fetchCategories = useCallback(async () => {
        if (!targetUserId) return;
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching categories:', error);
            return;
        }
        setCategories(data || []);
    }, [targetUserId]);

    const fetchServices = useCallback(async () => {
        if (!targetUserId) return;
        const { data, error } = await supabase
            .from('services')
            .select('*, categories(name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching services:', error);
            return;
        }

        // Map category name to service for easier UI use
        const mappedServices = (data || []).map((s: any) => ({
            ...s,
            category: s.categories?.name || 'Без категории'
        }));

        setServices(mappedServices);
    }, [targetUserId]);

    const fetchData = useCallback(async () => {
        if (!targetUserId) return;
        setLoading(true);
        await Promise.all([fetchCategories(), fetchServices()]);
        setLoading(false);
    }, [fetchCategories, fetchServices, targetUserId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addCategory = async (name: string) => {
        if (!user || !name) return;
        const { data, error } = await supabase
            .from('categories')
            .insert({ name, user_id: user.id })
            .select()
            .single();

        if (error) {
            toast.error('Ошибка при создании категории');
            return null;
        }

        setCategories(prev => [...prev, data]);
        toast.success(`Категория "${name}" создана`);
        return data;
    };

    const addService = async (service: Omit<Service, 'id' | 'category'>) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('services')
            .insert({
                name: service.name,
                price: service.price,
                duration: service.duration,
                category_id: service.category_id,
                user_id: user.id
            })
            .select('*, categories(name)')
            .single();

        if (error) {
            toast.error('Ошибка при создании услуги');
            return null;
        }

        const newService = {
            ...data,
            category: data.categories?.name || 'Без категории'
        };

        setServices(prev => [newService, ...prev]);
        toast.success(`Услуга "${service.name}" добавлена`);
        return newService;
    };

    const deleteService = async (id: string) => {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Ошибка при удалении услуги');
            return false;
        }

        setServices(prev => prev.filter(s => s.id !== id));
        toast.success('Услуга удалена');
        return true;
    };

    const updateService = async (id: string, updates: Partial<Service>) => {
        const { data, error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', id)
            .select('*, categories(name)')
            .single();

        if (error) {
            toast.error('Ошибка при обновлении услуги');
            return null;
        }

        const updated = {
            ...data,
            category: data.categories?.name || 'Без категории'
        };

        setServices(prev => prev.map(s => s.id === id ? updated : s));
        toast.success('Услуга обновлена');
        return updated;
    };

    return {
        services,
        categories,
        loading,
        addCategory,
        addService,
        deleteService,
        updateService,
        refresh: fetchData
    };
}
