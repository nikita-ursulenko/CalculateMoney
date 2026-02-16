import { useState, useEffect, useCallback } from 'react';
import { Scissors, Search, Clock, Euro, MoreVertical, Edit2, Trash2, Plus, LayoutGrid, Tag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


import { useServices, Service, Category } from '@/hooks/useServices';

export default function ServicesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const {
        services,
        categories,
        loading,
        addCategory,
        addService,
        deleteService,
        updateService
    } = useServices();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newService, setNewService] = useState({ name: '', price: '', duration: '', category_id: '' });
    const [newCategory, setNewCategory] = useState('');

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [editForm, setEditForm] = useState({ name: '', price: '', duration: '', category_id: '' });

    useEffect(() => {
        const handleOpenCreate = () => setIsCreateOpen(true);
        window.addEventListener('open-service-create', handleOpenCreate);
        return () => window.removeEventListener('open-service-create', handleOpenCreate);
    }, []);

    const [selectedCategory, setSelectedCategory] = useState<string>('Все');

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'Все' || service.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleAddService = async () => {
        if (!newService.name || !newService.price || !newService.category_id) return;

        const success = await addService({
            name: newService.name,
            price: Number(newService.price),
            duration: newService.duration ? Number(newService.duration) : null,
            category_id: newService.category_id
        });

        if (success) {
            setNewService({ name: '', price: '', duration: '', category_id: '' });
            setIsCreateOpen(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory || categories.some(c => c.name === newCategory)) return;
        const success = await addCategory(newCategory);
        if (success) {
            setNewCategory('');
            setIsCreateOpen(false);
        }
    };

    const handleDeleteService = async (id: string) => {
        await deleteService(id);
    };

    const handleEditService = (service: Service) => {
        setEditingService(service);
        setEditForm({
            name: service.name,
            price: service.price.toString(),
            duration: service.duration ? service.duration.toString() : '',
            category_id: service.category_id || ''
        });
        setIsEditOpen(true);
    };

    const handleUpdateService = async () => {
        if (!editingService || !editForm.name || !editForm.price || !editForm.category_id) return;

        const success = await updateService(editingService.id, {
            name: editForm.name,
            price: Number(editForm.price),
            duration: editForm.duration ? Number(editForm.duration) : null,
            category_id: editForm.category_id
        });

        if (success) {
            setIsEditOpen(false);
            setEditingService(null);
        }
    };

    return (
        <div className="min-h-screen pb-32 bg-background">
            <div className="pt-6" />

            {/* Header Container */}
            <div className="px-5 mb-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black flex items-center gap-2">
                            <Scissors className="text-primary" size={24} />
                            Услуги
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                        <Input
                            placeholder="Поиск услуг..."
                            className="pl-10 h-12 rounded-2xl bg-card border-none shadow-sm focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                        {['Все', ...categories.map(c => c.name)].map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "secondary"}
                                size="sm"
                                onClick={() => setSelectedCategory(category)}
                                className={cn(
                                    "rounded-full h-8 px-4 text-xs font-bold whitespace-nowrap transition-all",
                                    selectedCategory === category
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "bg-card hover:bg-primary/10 hover:text-primary border-none"
                                )}
                            >
                                {category}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Services List */}
            <div className="px-5">
                <div className="grid gap-3">
                    {loading ? (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 w-full bg-card rounded-3xl animate-pulse border border-border/50" />
                            ))}
                        </div>
                    ) : filteredServices.length > 0 ? (
                        filteredServices.map((service, index) => (
                            <div
                                key={service.id}
                                className="group relative bg-card rounded-3xl p-4 shadow-sm border border-border/50 hover:shadow-md transition-all animate-slide-up"
                                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-70">
                                            {service.category}
                                        </span>
                                        <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                                            {service.name}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            {service.duration && (
                                                <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full text-xs font-medium">
                                                    <Clock size={12} className="text-primary/70" />
                                                    {service.duration} мин
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2.5 py-1 rounded-full text-xs font-bold">
                                                <Euro size={12} />
                                                {service.price}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 self-start">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                                            onClick={() => handleEditService(service)}
                                            title="Редактировать"
                                        >
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                            onClick={() => handleDeleteService(service.id)}
                                            title="Удалить"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground animate-fade-in">
                            <p className="text-lg mb-1 font-medium">Ничего не найдено</p>
                            <p className="text-sm">Попробуйте изменить запрос</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Создать новое</DialogTitle>
                        <DialogDescription>
                            Добавьте новую категорию или услугу в ваш прайс-лист.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="service" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-secondary/50 p-1">
                            <TabsTrigger value="service" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Scissors size={14} className="mr-2" />
                                Услуга
                            </TabsTrigger>
                            <TabsTrigger value="category" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <LayoutGrid size={14} className="mr-2" />
                                Категория
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="service" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="service-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Название услуги</Label>
                                <Input
                                    id="service-name"
                                    placeholder="Например: Маникюр + гель-лак"
                                    className="h-12 rounded-2xl bg-secondary/30 border-none px-4"
                                    value={newService.name}
                                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Цена (€)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        placeholder="50"
                                        className="h-12 rounded-2xl bg-secondary/30 border-none px-4"
                                        value={newService.price}
                                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                        Длительность <span className="lowercase font-normal opacity-70">(необязательно)</span>
                                    </Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        placeholder="60"
                                        className="h-12 rounded-2xl bg-secondary/30 border-none px-4"
                                        value={newService.duration}
                                        onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Категория</Label>
                                <Select
                                    value={newService.category_id}
                                    onValueChange={(value) => setNewService({ ...newService, category_id: value })}
                                >
                                    <SelectTrigger className="h-12 rounded-2xl bg-secondary/30 border-none px-4">
                                        <SelectValue placeholder="Выберите категорию" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-xl">
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="rounded-xl">{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleAddService} className="w-full h-12 rounded-2xl font-bold mt-2 shadow-lg shadow-primary/20">
                                <Plus size={20} className="mr-2" />
                                Добавить услугу
                            </Button>
                        </TabsContent>

                        <TabsContent value="category" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="category-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Название категории</Label>
                                <Input
                                    id="category-name"
                                    placeholder="Например: Педикюр или СПА"
                                    className="h-12 rounded-2xl bg-secondary/30 border-none px-4"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddCategory} className="w-full h-12 rounded-2xl font-bold mt-2 shadow-lg shadow-primary/20">
                                <Plus size={20} className="mr-2" />
                                Создать категорию
                            </Button>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
            {/* Edit Service Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Редактировать услугу</DialogTitle>
                        <DialogDescription>
                            Измените данные услуги в вашем прайс-листе.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-service-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Название услуги</Label>
                            <Input
                                id="edit-service-name"
                                placeholder="Например: Маникюр + гель-лак"
                                className="h-12 rounded-2xl bg-secondary/30 border-none px-4"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Цена (€)</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    placeholder="50"
                                    className="h-12 rounded-2xl bg-secondary/30 border-none px-4"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                    Длительность <span className="lowercase font-normal opacity-70">(необязательно)</span>
                                </Label>
                                <Input
                                    id="edit-duration"
                                    type="number"
                                    placeholder="60"
                                    className="h-12 rounded-2xl bg-secondary/30 border-none px-4"
                                    value={editForm.duration}
                                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Категория</Label>
                            <Select
                                value={editForm.category_id}
                                onValueChange={(value) => setEditForm({ ...editForm, category_id: value })}
                            >
                                <SelectTrigger className="h-12 rounded-2xl bg-secondary/30 border-none px-4">
                                    <SelectValue placeholder="Выберите категорию" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id} className="rounded-xl">{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleUpdateService} className="w-full h-12 rounded-2xl font-bold mt-2 shadow-lg shadow-primary/20">
                            <Check size={20} className="mr-2" />
                            Сохранить изменения
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
