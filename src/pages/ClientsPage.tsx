import { useState, useEffect, useRef } from 'react';
import { Users, Search, MoreVertical, Phone, Calendar, Euro, ChevronRight, User, Plus, MessageSquare, Trash2, History, ExternalLink, Download, Upload, Pencil, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTitle as AlertDialogTitleComp,
} from "@/components/ui/alert-dialog";
import { useClients, Client } from '@/hooks/useClients';
import { useUserRole } from "@/hooks/useUserRole";

export default function ClientsPage() {
    const { clients, loading, addClient, updateClient, deleteClient } = useClients();
    const { isAdmin } = useUserRole();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhones, setNewPhones] = useState<{ label: string, number: string }[]>([{ label: '', number: '' }]);
    const [newDescription, setNewDescription] = useState('');

    // States for editing
    const [editName, setEditName] = useState('');
    const [editPhones, setEditPhones] = useState<{ label: string, number: string }[]>([]);
    const [editDescription, setEditDescription] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyEntries, setHistoryEntries] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [clientStats, setClientStats] = useState<Record<string, { count: number, total: number, last: string | null }>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedClient) {
            setEditName(selectedClient.name);
            setEditDescription(selectedClient.description || '');

            // Parse comma-separated phone string into array of objects
            if (selectedClient.phone) {
                const parsedPhones = selectedClient.phone.split(',').map(p => {
                    const parts = p.trim().split(':');
                    if (parts.length > 1) {
                        return { label: parts[0].trim(), number: parts[1].trim() };
                    }
                    return { label: '', number: parts[0].trim() };
                });
                setEditPhones(parsedPhones);
            } else {
                setEditPhones([{ label: '', number: '' }]);
            }
            setIsEditMode(false);
        }
    }, [selectedClient]);

    useEffect(() => {
        const handleOpenCreate = () => {
            if (isAdmin) {
                setIsCreateOpen(true);
            } else {
                toast.error('Только администратор может добавлять клиентов');
            }
        };
        window.addEventListener('open-client-create', handleOpenCreate);
        return () => window.removeEventListener('open-client-create', handleOpenCreate);
    }, [isAdmin]);

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !isAdmin) return;

        // Clean up phones and ensure "+" prefix
        const processedPhones = newPhones
            .map(p => {
                let num = p.number.trim().replace(/[^\d+]/g, '');
                if (num && !num.startsWith('+') && /^\d/.test(num)) {
                    num = '+' + num;
                }
                return { ...p, number: num };
            })
            .filter(p => p.number);

        const phoneStr = processedPhones
            .map(p => p.label ? `${p.label}: ${p.number}` : p.number)
            .join(', ');

        const { error } = await addClient({
            name: newName,
            phone: phoneStr,
            description: newDescription,
        });

        if (!error) {
            setIsCreateOpen(false);
            setNewName('');
            setNewPhones([{ label: '', number: '' }]);
            setNewDescription('');
            toast.success('Клиент успешно создан');
        } else {
            toast.error('Ошибка при создании клиента');
        }
    };

    const handleDeleteClient = async () => {
        if (!selectedClient || !isAdmin) return;
        const { error } = await deleteClient(selectedClient.id);
        if (!error) {
            setSelectedClient(null);
            setIsDeleteAlertOpen(false);
            toast.info('Клиент удален');
        } else {
            toast.error('Ошибка при удалении');
        }
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !editName || !isAdmin) return;

        // Clean up phones and ensure "+" prefix
        const processedPhones = editPhones
            .map(p => {
                let num = p.number.trim().replace(/[^\d+]/g, '');
                if (num && !num.startsWith('+') && /^\d/.test(num)) {
                    num = '+' + num;
                }
                return { ...p, number: num };
            })
            .filter(p => p.number);

        const phoneStr = processedPhones
            .map(p => p.label ? `${p.label}: ${p.number}` : p.number)
            .join(', ');

        const { error } = await updateClient(selectedClient.id, {
            name: editName,
            phone: phoneStr,
            description: editDescription
        });

        if (!error) {
            setSelectedClient({ ...selectedClient, name: editName, phone: phoneStr, description: editDescription });
            setIsEditMode(false);
            toast.success('Данные обновлены');
        } else {
            toast.error('Ошибка при обновлении');
        }
    };

    const fetchHistory = async (clientId: string) => {
        setHistoryLoading(true);
        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('client_id', clientId)
            .order('date', { ascending: false });

        if (!error && data) {
            setHistoryEntries(data);
        }
        setHistoryLoading(false);
        setIsHistoryOpen(true);
    };

    useEffect(() => {
        const fetchAllStats = async () => {
            const { data, error } = await supabase
                .from('entries')
                .select('client_id, price, date')
                .not('client_id', 'is', null);

            if (!error && data) {
                const stats: Record<string, { count: number, total: number, last: string | null }> = {};
                data.forEach(entry => {
                    const cid = entry.client_id;
                    if (!stats[cid]) {
                        stats[cid] = { count: 0, total: 0, last: null };
                    }
                    stats[cid].count += 1;
                    stats[cid].total += Number(entry.price);
                    if (!stats[cid].last || new Date(entry.date) > new Date(stats[cid].last)) {
                        stats[cid].last = entry.date;
                    }
                });
                setClientStats(stats);
            }
        };

        if (clients.length > 0) {
            fetchAllStats();
        }
    }, [clients]);

    const handleExport = () => {
        if (!isAdmin) return;
        const dataStr = JSON.stringify(clients, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `clients_export_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        toast.success('Экспорт завершен');
    };

    const parseVCF = (vcfText: string): any[] => {
        const vCards = vcfText.split('BEGIN:VCARD');
        const imported: any[] = [];

        vCards.forEach(card => {
            if (!card.trim()) return;

            // Extract Full Name (FN)
            const fnMatch = card.match(/^FN(?:;.*?)*:(.*)$/m);
            const nameMatch = fnMatch ? fnMatch[1].trim() : '';

            // Extract Telephone (TEL) and Labels
            const phones: string[] = [];

            // First, find all TEL entries
            const telMatches = [...card.matchAll(/^(?:(item\d+)\.)?TEL(?:;.*?)*:(.*)$/gm)];

            telMatches.forEach(match => {
                const group = match[1]; // e.g., "item1"
                const phone = match[2].trim().replace(/[^\d+]/g, '');

                if (!phone) return;

                let label = '';
                if (group) {
                    // Look for a matching label for this group
                    const labelRegex = new RegExp(`^${group}\\.X-ABLabel:(.*)$`, 'm');
                    const labelMatch = card.match(labelRegex);
                    if (labelMatch) {
                        label = labelMatch[1].trim();
                    }
                }

                phones.push(label ? `${label}: ${phone}` : phone);
            });

            const phoneMatch = phones.join(', ');

            // Extract Notes (NOTE)
            const noteMatch = card.match(/^NOTE(?:;.*?)*:(.*)$/m);
            const descriptionMatch = noteMatch ? noteMatch[1].trim() : '';

            if (nameMatch) {
                imported.push({
                    name: nameMatch,
                    phone: phoneMatch,
                    description: descriptionMatch
                });
            }
        });

        return imported;
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin) return;
        const file = e.target.files?.[0];
        if (!file) return;

        const isVCF = file.name.toLowerCase().endsWith('.vcf');
        const reader = new FileReader();

        reader.onload = async (event) => {
            const content = event.target?.result as string;
            try {
                let toImport: any[] = [];
                if (isVCF) {
                    toImport = parseVCF(content);
                } else {
                    const importedClients = JSON.parse(content);
                    if (Array.isArray(importedClients)) {
                        toImport = importedClients.filter(c => c.name && typeof c.name === 'string');
                    }
                }

                if (toImport.length > 0) {
                    toast.loading(`Импорт ${toImport.length} клиентов...`);
                    let successCount = 0;
                    for (const client of toImport) {
                        const { error } = await addClient({
                            name: client.name,
                            phone: client.phone || '',
                            description: client.description || ''
                        });
                        if (!error) successCount++;
                    }
                    toast.dismiss();
                    toast.success(`Успешно импортировано ${successCount} из ${toImport.length} клиентов`);
                } else {
                    toast.error('Клиенты для импорта не найдены');
                }
            } catch (error) {
                toast.error('Ошибка при чтении файла');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const filteredClients = clients.map(client => {
        const stats = clientStats[client.id] || { count: 0, total: 0, last: null };
        return {
            ...client,
            visitCount: stats.count,
            totalSpent: stats.total,
            lastVisit: stats.last
        };
    }).filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone && client.phone.includes(searchQuery))
    );

    return (
        <div className="min-h-screen pb-32 bg-background">
            <div className="pt-6" />

            {/* Header Container */}
            <div className="px-5 mb-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black flex items-center gap-2">
                                <Users className="text-primary" size={24} />
                                Клиенты
                            </h1>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                                Всего: {clients.length}
                            </span>
                        </div>
                        {isAdmin && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="rounded-xl h-9 px-3 border-border/50 bg-card/50 hover:bg-primary/10 hover:text-primary transition-all text-xs font-bold gap-2"
                                >
                                    <Download size={14} />
                                    Импорт
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExport}
                                    className="rounded-xl h-9 px-3 border-border/50 bg-card/50 hover:bg-primary/10 hover:text-primary transition-all text-xs font-bold gap-2"
                                >
                                    <Upload size={14} />
                                    Экспорт
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".json,.vcf"
                                    onChange={handleImport}
                                />
                            </div>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                        <Input
                            placeholder="Поиск по имени или телефону..."
                            className="pl-10 h-12 rounded-2xl bg-card border-none shadow-sm focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Clients List */}
            <div className="px-5">
                <div className="grid gap-3">
                    {filteredClients.length > 0 ? (
                        filteredClients.map((client, index) => (
                            <button
                                key={client.id}
                                type="button"
                                onClick={() => setSelectedClient(client)}
                                className="group w-full text-left relative bg-card rounded-3xl p-4 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all animate-slide-up"
                                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                            <User size={24} />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                                                {client.name}
                                                <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            </h3>
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                                                <Phone size={12} className="text-primary/70" />
                                                {client.phone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>

                                {/* Stats Bar */}
                                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Визитов</span>
                                        <span className="text-sm font-black">{client.visitCount || 0}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Всего</span>
                                        <span className="text-sm font-black text-primary">{client.totalSpent || 0}€</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 items-end">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Был(а)</span>
                                        <span className="text-[10px] font-bold bg-secondary px-2 py-0.5 rounded-full">
                                            {client.lastVisit
                                                ? new Date(client.lastVisit).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                                                : 'Никогда'}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground animate-fade-in">
                            <p className="text-lg mb-1 font-medium">Клиенты не найдены</p>
                            <p className="text-sm">Попробуйте изменить запрос</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Client Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-background/95 backdrop-blur-xl sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2">
                            <Plus className="text-primary" size={20} />
                            Новый клиент
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateClient} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold ml-1">Имя</Label>
                                <Input
                                    id="name"
                                    placeholder="Введите имя клиента"
                                    className="input-beauty h-12"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-1">
                                    <Label className="text-sm font-bold">Телефоны</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/10"
                                        onClick={() => setNewPhones([...newPhones, { label: '', number: '' }])}
                                    >
                                        <Plus size={14} className="mr-1" /> Добавить
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {newPhones.map((p, i) => (
                                        <div key={i} className="flex gap-2">
                                            <div className="w-24 shrink-0">
                                                <Input
                                                    placeholder="Метка"
                                                    className="input-beauty h-11 text-xs"
                                                    value={p.label}
                                                    onChange={(e) => {
                                                        const nPhones = [...newPhones];
                                                        nPhones[i].label = e.target.value;
                                                        setNewPhones(nPhones);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 relative">
                                                <Input
                                                    placeholder="+___"
                                                    className="input-beauty h-11 text-sm pl-8"
                                                    value={p.number}
                                                    onChange={(e) => {
                                                        const nPhones = [...newPhones];
                                                        let val = e.target.value;
                                                        if (val.length === 1 && /^\d/.test(val)) val = '+' + val;
                                                        nPhones[i].number = val;
                                                        setNewPhones(nPhones);
                                                    }}
                                                />
                                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                            </div>
                                            {newPhones.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-11 w-11 rounded-2xl text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        setNewPhones(newPhones.filter((_, idx) => idx !== i));
                                                    }}
                                                >
                                                    <X size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-bold ml-1">Описание (заметки)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Например: аллергия на лак, предпочитает кофе..."
                                    className="input-beauty min-h-[100px] py-3 rounded-2xl resize-none"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsCreateOpen(false)}
                                className="rounded-2xl h-12 font-bold"
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-2xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                            >
                                Создать клиента
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Client Details Dialog */}
            <Dialog open={!!selectedClient} onOpenChange={(open) => {
                if (!open) {
                    setSelectedClient(null);
                    setIsEditMode(false);
                }
            }}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-background/95 backdrop-blur-xl sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                    {selectedClient && (
                        <>
                            <DialogHeader>
                                <div className="flex justify-between items-start pr-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <User size={24} />
                                        </div>
                                        <div className="flex flex-col">
                                            <DialogTitle className="text-xl font-black">
                                                {isEditMode ? 'Редактирование' : selectedClient.name}
                                            </DialogTitle>
                                            {!isEditMode && selectedClient.phone && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Контактные номера</p>
                                                    <div className="space-y-2">
                                                        {selectedClient.phone.split(',').map((p, i) => {
                                                            const parts = p.trim().split(':');
                                                            const label = parts.length > 1 ? parts[0].trim() : '';
                                                            const number = parts.length > 1 ? parts[1].trim() : parts[0].trim();

                                                            return (
                                                                <div key={i} className={cn(
                                                                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                                                                    i === 0 ? "bg-primary/5 border-primary/20" : "bg-secondary/20 border-border/50"
                                                                )}>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={cn(
                                                                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                                                            i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                                                        )}>
                                                                            <Phone size={16} />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            {label && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-0.5">{label}</span>}
                                                                            <span className="text-sm font-black">{number}</span>
                                                                        </div>
                                                                    </div>

                                                                    {i > 0 && isAdmin && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                const allPhones = selectedClient.phone.split(',').map(item => item.trim());
                                                                                const selected = allPhones.splice(i, 1)[0];
                                                                                const newPhoneStr = [selected, ...allPhones].join(', ');

                                                                                const { error } = await updateClient(selectedClient.id, {
                                                                                    ...selectedClient,
                                                                                    phone: newPhoneStr
                                                                                });

                                                                                if (!error) {
                                                                                    setSelectedClient({ ...selectedClient, phone: newPhoneStr });
                                                                                    toast.success('Основной номер изменен');
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Check size={16} />
                                                                        </Button>
                                                                    )}
                                                                    {i === 0 && (
                                                                        <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Основной</div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            {isEditMode ? (
                                <form onSubmit={handleUpdateClient} className="space-y-5 pt-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-name" className="text-sm font-bold ml-1">Имя</Label>
                                            <Input
                                                id="edit-name"
                                                className="input-beauty h-12"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between ml-1">
                                                <Label className="text-sm font-bold">Телефоны</Label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/10"
                                                    onClick={() => setEditPhones([...editPhones, { label: '', number: '' }])}
                                                >
                                                    <Plus size={14} className="mr-1" /> Добавить
                                                </Button>
                                            </div>
                                            <div className="space-y-3">
                                                {editPhones.map((p, i) => (
                                                    <div key={i} className="flex gap-2 animate-in slide-in-from-right-2 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                                                        <div className="w-24 shrink-0">
                                                            <Input
                                                                placeholder="Метка"
                                                                className="input-beauty h-11 text-xs"
                                                                value={p.label}
                                                                onChange={(e) => {
                                                                    const newPhones = [...editPhones];
                                                                    newPhones[i].label = e.target.value;
                                                                    setEditPhones(newPhones);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <Input
                                                                placeholder="+49..."
                                                                className="input-beauty h-11 text-sm pl-8"
                                                                value={p.number}
                                                                onChange={(e) => {
                                                                    const newPhones = [...editPhones];
                                                                    let val = e.target.value;
                                                                    // Simple auto-prefix + if digit entered without it
                                                                    if (val.length === 1 && /^\d/.test(val)) val = '+' + val;
                                                                    newPhones[i].number = val;
                                                                    setEditPhones(newPhones);
                                                                }}
                                                            />
                                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                                        </div>
                                                        {editPhones.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-11 w-11 rounded-2xl text-destructive hover:bg-destructive/10"
                                                                onClick={() => {
                                                                    const newPhones = editPhones.filter((_, idx) => idx !== i);
                                                                    setEditPhones(newPhones);
                                                                }}
                                                            >
                                                                <X size={16} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-description" className="text-sm font-bold ml-1">Описание</Label>
                                            <Textarea
                                                id="edit-description"
                                                className="input-beauty min-h-[100px] py-3 rounded-2xl resize-none"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setIsEditMode(false)}
                                            className="rounded-2xl h-12 font-bold"
                                        >
                                            Отмена
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="rounded-2xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                                        >
                                            Сохранить
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6 pt-4 h-full overflow-y-auto pr-1 -mr-1">
                                    {selectedClient.description && (
                                        <div className="bg-secondary/20 p-4 rounded-3xl border border-border/50">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Заметка</p>
                                            <p className="text-sm font-medium leading-relaxed italic text-foreground/80">
                                                "{selectedClient.description}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-secondary/30 p-4 rounded-3xl flex flex-col gap-1 items-center justify-center text-center">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Посетил(а)</span>
                                            <span className="text-xl font-black">{selectedClient.visitCount || 0} раз</span>
                                        </div>
                                        <div className="bg-primary/5 p-4 rounded-3xl flex flex-col gap-1 items-center justify-center text-center">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Всего принес(ла)</span>
                                            <span className="text-xl font-black text-primary">{selectedClient.totalSpent || 0}€</span>
                                        </div>
                                    </div>

                                    {/* Actions Group */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Связаться (основной)</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                className="h-16 rounded-3xl flex flex-col gap-1 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-green-500/20 group"
                                                onClick={() => {
                                                    const firstPhone = selectedClient.phone?.split(',')[0].split(':').pop()?.trim().replace(/[^\d+]/g, '');
                                                    if (firstPhone) window.open(`https://wa.me/${firstPhone.startsWith('+') ? firstPhone.slice(1) : firstPhone}`, '_blank');
                                                }}
                                            >
                                                <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold leading-none">WhatsApp</span>
                                            </Button>
                                            <Button
                                                className="h-16 rounded-3xl flex flex-col gap-1 bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-lg shadow-primary/20 group"
                                                onClick={() => {
                                                    const firstPhone = selectedClient.phone?.split(',')[0].split(':').pop()?.trim().replace(/[^\d+]/g, '');
                                                    if (firstPhone) window.location.href = `tel:${firstPhone}`;
                                                }}
                                            >
                                                <Phone size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold leading-none">Позвонить</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Больше</p>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full h-12 rounded-2xl justify-start px-6 gap-3 font-bold group"
                                                    onClick={() => setIsEditMode(true)}
                                                >
                                                    <Pencil size={18} className="text-primary group-hover:scale-110 transition-transform" />
                                                    Изменить данные
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="w-full h-12 rounded-2xl justify-start px-6 gap-3 font-bold group"
                                                    disabled={historyLoading}
                                                    onClick={() => fetchHistory(selectedClient.id)}
                                                >
                                                    <History size={18} className={cn("text-primary group-hover:scale-110 transition-transform", historyLoading && "animate-spin")} />
                                                    {historyLoading ? 'Загрузка...' : 'История посещений'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full h-12 rounded-2xl justify-start px-6 gap-3 font-bold text-destructive hover:text-destructive hover:bg-destructive/10 group"
                                                    onClick={() => setIsDeleteAlertOpen(true)}
                                                >
                                                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                                    Удалить клиента
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Visit History Dialog */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-background/95 backdrop-blur-xl sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2">
                            <History className="text-primary" size={20} />
                            История: {selectedClient?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {historyEntries.length > 0 ? (
                            <div className="space-y-3">
                                {historyEntries.map((entry, idx) => (
                                    <div key={entry.id} className="bg-secondary/20 p-4 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black">
                                                    {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                {entry.start_time && (
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{entry.start_time} - {entry.end_time}</span>
                                                )}
                                            </div>
                                            <span className="text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                                                {entry.price}€
                                            </span>
                                        </div>
                                        <div className="text-xs font-medium text-foreground/80 leading-relaxed">
                                            {entry.service}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground animate-fade-in">
                                <History size={40} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg mb-1 font-medium">История пуста</p>
                                <p className="text-sm px-8">У этого клиента ещё не было записанных визитов</p>
                            </div>
                        )}
                        <Button
                            variant="secondary"
                            className="w-full h-12 rounded-2xl font-bold mt-4"
                            onClick={() => setIsHistoryOpen(false)}
                        >
                            Закрыть
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black">Удалить клиента?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-medium">
                            Это действие нельзя отменить. Все данные о визитах клиента будут сохранены в статистике, но сам контакт исчезнет.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-2xl h-12 font-bold border-none bg-secondary/50">Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteClient}
                            className="rounded-2xl h-12 font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                        >
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
