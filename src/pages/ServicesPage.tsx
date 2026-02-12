import { useState, useEffect, useCallback } from 'react';
import { Scissors, Search, Clock, Euro, MoreVertical, Edit2, Trash2, Plus, LayoutGrid, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Service {
    id: string;
    name: string;
    price: number;
    duration: number; // in minutes
    category: string;
}

const INITIAL_SERVICES: Service[] = [
    { id: '1', name: 'Маникюр с покрытием', price: 50, duration: 90, category: 'Ногти' },
    { id: '2', name: 'Педикюр без покрытия', price: 40, duration: 60, category: 'Ногти' },
    { id: '3', name: 'Наращивание ресниц 2D', price: 65, duration: 120, category: 'Ресницы' },
    { id: '4', name: 'Коррекция бровей', price: 15, duration: 30, category: 'Брови' },
    { id: '5', name: 'Снятие гель-лака', price: 10, duration: 20, category: 'Ногти' },
];

const INITIAL_CATEGORIES = ['Ногти', 'Ресницы', 'Брови', 'Уход'];

export default function ServicesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
    const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [newService, setNewService] = useState({ name: '', price: '', duration: '', category: '' });
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => {
        const handleOpenCreate = () => setIsCreateOpen(true);
        window.addEventListener('open-service-create', handleOpenCreate);
        return () => window.removeEventListener('open-service-create', handleOpenCreate);
    }, []);

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddService = () => {
        if (!newService.name || !newService.price || !newService.category) return;

        const service: Service = {
            id: Math.random().toString(36).substr(2, 9),
            name: newService.name,
            price: Number(newService.price),
            duration: Number(newService.duration) || 30,
            category: newService.category
        };

        setServices([service, ...services]);
        setNewService({ name: '', price: '', duration: '', category: '' });
        setIsCreateOpen(false);
    };

    const handleAddCategory = () => {
        if (!newCategory || categories.includes(newCategory)) return;
        setCategories([...categories, newCategory]);
        setNewCategory('');
        setIsCreateOpen(false);
    };

    const handleDeleteService = (id: string) => {
        setServices(services.filter(s => s.id !== id));
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
                </div>
            </div>

            {/* Services List */}
            <div className="px-5">
                <div className="grid gap-3">
                    {filteredServices.length > 0 ? (
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
                                            <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full text-xs font-medium">
                                                <Clock size={12} className="text-primary/70" />
                                                {service.duration} мин
                                            </div>
                                            <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2.5 py-1 rounded-full text-xs font-bold">
                                                <Euro size={12} />
                                                {service.price}
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical size={18} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-xl bg-background/80 backdrop-blur">
                                            <DropdownMenuItem className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary py-2 px-3">
                                                <Edit2 size={16} />
                                                <span className="font-medium">Редактировать</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-destructive/10 focus:text-destructive text-destructive/80 py-2 px-3"
                                                onClick={() => handleDeleteService(service.id)}
                                            >
                                                <Trash2 size={16} />
                                                <span className="font-medium">Удалить</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
                                    <Label htmlFor="duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Длительность (мин)</Label>
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
                                    value={newService.category}
                                    onValueChange={(value) => setNewService({ ...newService, category: value })}
                                >
                                    <SelectTrigger className="h-12 rounded-2xl bg-secondary/30 border-none px-4">
                                        <SelectValue placeholder="Выберите категорию" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-xl">
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat} className="rounded-xl">{cat}</SelectItem>
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
        </div>
    );
}
