import { useState, useEffect, useRef } from 'react';
import { Users, Search, MoreVertical, Phone, Calendar, Euro, ChevronRight, User, Plus, MessageSquare, Trash2, History, ExternalLink, Download, Upload, Pencil, Check, X } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

interface Client {
    id: string;
    name: string;
    phone: string;
    description?: string;
    lastVisit: string;
    totalSpent: number;
    visitCount: number;
}

const MOCK_CLIENTS: Client[] = [
    { id: '1', name: 'Анна Петрова', phone: '+7 900 123-45-67', lastVisit: '2026-02-10', totalSpent: 450, visitCount: 8 },
    { id: '2', name: 'Елена Сидорова', phone: '+7 900 765-43-21', lastVisit: '2026-02-08', totalSpent: 280, visitCount: 5 },
    { id: '3', name: 'Мария Иванова', phone: '+7 900 111-22-33', lastVisit: '2026-01-25', totalSpent: 1200, visitCount: 15 },
    { id: '4', name: 'Ольга Кузнецова', phone: '+7 900 444-55-66', lastVisit: '2026-02-11', totalSpent: 60, visitCount: 1 },
    { id: '5', name: 'Светлана Попова', phone: '+7 900 999-88-77', lastVisit: '2026-02-01', totalSpent: 340, visitCount: 4 },
];

export default function ClientsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newDescription, setNewDescription] = useState('');

    // States for editing
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedClient) {
            setEditName(selectedClient.name);
            setEditPhone(selectedClient.phone);
            setEditDescription(selectedClient.description || '');
            setIsEditMode(false);
        }
    }, [selectedClient]);

    useEffect(() => {
        const handleOpenCreate = () => setIsCreateOpen(true);
        window.addEventListener('open-client-create', handleOpenCreate);
        return () => window.removeEventListener('open-client-create', handleOpenCreate);
    }, []);

    const handleCreateClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        const newClient: Client = {
            id: Math.random().toString(36).substr(2, 9),
            name: newName,
            phone: newPhone,
            description: newDescription,
            lastVisit: new Date().toISOString().split('T')[0],
            totalSpent: 0,
            visitCount: 0
        };

        setClients([newClient, ...clients]);
        setIsCreateOpen(false);
        setNewName('');
        setNewPhone('');
        setNewDescription('');
        toast.success('Клиент успешно создан');
    };

    const handleDeleteClient = () => {
        if (!selectedClient) return;
        setClients(clients.filter(c => c.id !== selectedClient.id));
        setSelectedClient(null);
        setIsDeleteAlertOpen(false);
        toast.info('Клиент удален');
    };

    const handleUpdateClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !editName) return;

        const updatedClients = clients.map(c =>
            c.id === selectedClient.id
                ? { ...c, name: editName, phone: editPhone, description: editDescription }
                : c
        );

        setClients(updatedClients);
        setSelectedClient({ ...selectedClient, name: editName, phone: editPhone, description: editDescription });
        setIsEditMode(false);
        toast.success('Данные обновлены');
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(clients, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `clients_export_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        toast.success('Экспорт завершен');
    };

    const parseVCF = (vcfText: string): Client[] => {
        const vCards = vcfText.split('BEGIN:VCARD');
        const imported: Client[] = [];

        vCards.forEach(card => {
            if (!card.trim()) return;

            // Extract Full Name (FN)
            const fnMatch = card.match(/^FN(?:;.*?)*:(.*)$/m);
            const nameMatch = fnMatch ? fnMatch[1].trim() : '';

            // Extract Telephone (TEL)
            const telMatch = card.match(/^TEL(?:;.*?)*:(.*)$/m);
            const phoneMatch = telMatch ? telMatch[1].trim().replace(/[^\d+]/g, '') : '';

            // Extract Notes (NOTE)
            const noteMatch = card.match(/^NOTE(?:;.*?)*:(.*)$/m);
            const descriptionMatch = noteMatch ? noteMatch[1].trim() : '';

            if (nameMatch) {
                imported.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: nameMatch,
                    phone: phoneMatch,
                    description: descriptionMatch,
                    lastVisit: new Date().toISOString().split('T')[0],
                    totalSpent: 0,
                    visitCount: 0
                });
            }
        });

        return imported;
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVCF = file.name.toLowerCase().endsWith('.vcf');
        const reader = new FileReader();

        reader.onload = (event) => {
            const content = event.target?.result as string;
            try {
                if (isVCF) {
                    const imported = parseVCF(content);
                    if (imported.length > 0) {
                        setClients(prev => [...imported, ...prev]);
                        toast.success(`Импортировано ${imported.length} контактов из VCF`);
                    } else {
                        toast.error('Контакты в файле не найдены');
                    }
                } else {
                    const importedClients = JSON.parse(content);
                    if (Array.isArray(importedClients)) {
                        const isValid = importedClients.every(c => c.name && typeof c.name === 'string');
                        if (isValid) {
                            setClients(importedClients);
                            toast.success(`Импортировано ${importedClients.length} клиентов`);
                        } else {
                            toast.error('Неверный формат файла');
                        }
                    }
                }
            } catch (error) {
                toast.error('Ошибка при чтении файла');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery)
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
                                        <span className="text-sm font-black">{client.visitCount}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Всего</span>
                                        <span className="text-sm font-black text-primary">{client.totalSpent}€</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 items-end">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Был(а)</span>
                                        <span className="text-[10px] font-bold bg-secondary px-2 py-0.5 rounded-full">
                                            {new Date(client.lastVisit).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
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
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-background/95 backdrop-blur-xl sm:max-w-[425px]">
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
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-bold ml-1">Телефон</Label>
                                <Input
                                    id="phone"
                                    placeholder="+7 (___) ___-__-__"
                                    className="input-beauty h-12"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                />
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
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-background/95 backdrop-blur-xl sm:max-w-[425px]">
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
                                            {!isEditMode && (
                                                <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                    <Phone size={14} className="text-primary/70" />
                                                    {selectedClient.phone}
                                                </span>
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
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-phone" className="text-sm font-bold ml-1">Телефон</Label>
                                            <Input
                                                id="edit-phone"
                                                className="input-beauty h-12"
                                                value={editPhone}
                                                onChange={(e) => setEditPhone(e.target.value)}
                                            />
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
                                            <span className="text-xl font-black">{selectedClient.visitCount} раз</span>
                                        </div>
                                        <div className="bg-primary/5 p-4 rounded-3xl flex flex-col gap-1 items-center justify-center text-center">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Всего принес(ла)</span>
                                            <span className="text-xl font-black text-primary">{selectedClient.totalSpent}€</span>
                                        </div>
                                    </div>

                                    {/* Actions Group */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Связаться</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button className="h-16 rounded-3xl flex flex-col gap-1 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-green-500/20 group">
                                                <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold leading-none">WhatsApp</span>
                                            </Button>
                                            <Button className="h-16 rounded-3xl flex flex-col gap-1 bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-lg shadow-primary/20 group" onClick={() => window.location.href = `tel:${selectedClient.phone}`}>
                                                <Phone size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold leading-none">Позвонить</span>
                                            </Button>
                                        </div>
                                    </div>

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
                                            <Button variant="secondary" className="w-full h-12 rounded-2xl justify-start px-6 gap-3 font-bold group">
                                                <History size={18} className="text-primary group-hover:scale-110 transition-transform" />
                                                История посещений
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
                                </div>
                            )}
                        </>
                    )}
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
