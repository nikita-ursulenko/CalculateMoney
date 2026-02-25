import { useState } from 'react';
import { Building2, Clock, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';

export default function OnboardingScreen() {
    const { user, signOut } = useAuth();
    const { refreshWorkspaces } = useWorkspace();
    const [mode, setMode] = useState<'choose' | 'create'>('choose');
    const [showInviteInfo, setShowInviteInfo] = useState(false);
    const [copied, setCopied] = useState(false);
    const [salonName, setSalonName] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCopyEmail = () => {
        if (!user?.email) return;
        navigator.clipboard.writeText(user.email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const [error, setError] = useState('');

    const handleCreateSalon = async () => {
        if (!salonName.trim() || !user) return;
        setCreating(true);
        setError('');

        try {
            // Create the workspace
            const { data: newWs, error: wsError } = await supabase
                .from('workspaces')
                .insert({ name: salonName.trim(), owner_id: user.id })
                .select()
                .single();

            if (wsError || !newWs) throw wsError || new Error('Failed to create salon');

            // Add user as admin member
            const { error: memberError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: newWs.id,
                    user_id: user.id,
                    role: 'admin',
                    manage_clients: true,
                    is_default: true
                });

            if (memberError) throw memberError;

            // Refresh workspace context — will now find the new one and proceed to the app
            await refreshWorkspaces?.();
        } catch (e: any) {
            setError(e?.message || 'Ошибка при создании салона');
            setCreating(false);
        }
    };

    if (mode === 'create') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
                <div className="w-full max-w-sm space-y-6 animate-fade-in">
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <Building2 size={32} className="text-primary" />
                        </div>
                        <h1 className="text-2xl font-black">Создать салон</h1>
                        <p className="text-muted-foreground text-sm">
                            Введите название вашего салона. Вы станете его администратором.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Название салона</Label>
                        <Input
                            placeholder="Например: Beauty Studio"
                            value={salonName}
                            onChange={(e) => setSalonName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateSalon()}
                            className="h-12 text-base font-semibold input-beauty"
                            autoFocus
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <Button
                        className="w-full h-12 btn-primary-gradient rounded-xl text-base font-bold"
                        onClick={handleCreateSalon}
                        disabled={!salonName.trim() || creating}
                    >
                        {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Создать и войти'}
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setMode('choose')}
                    >
                        ← Назад
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
            <div className="w-full max-w-sm space-y-4 animate-fade-in">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-2xl font-black">Добро пожаловать!</h1>
                    <p className="text-muted-foreground text-sm">
                        Вы ещё не привязаны ни к одному салону. Выберите, что хотите сделать:
                    </p>
                </div>

                {/* Create salon option */}
                <button
                    onClick={() => setMode('create')}
                    className="w-full p-5 rounded-2xl border-2 border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-primary/5 transition-all text-left space-y-1 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Building2 size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Создать свой салон</p>
                            <p className="text-xs text-muted-foreground">Вы будете администратором</p>
                        </div>
                    </div>
                </button>

                {/* Waiting for invite option */}
                <button
                    onClick={() => setShowInviteInfo(true)}
                    className="w-full p-5 rounded-2xl border-2 border-border/50 bg-secondary/30 hover:border-primary/30 transition-all text-left space-y-1 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                            <Clock size={20} className="text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Я приглашённый мастер</p>
                            <p className="text-xs text-muted-foreground">
                                Вам нужно получить приглашение от администратора салона
                            </p>
                        </div>
                    </div>
                </button>

                {/* Invite info dialog */}
                <Dialog open={showInviteInfo} onOpenChange={setShowInviteInfo}>
                    <DialogContent className="sm:max-w-sm rounded-3xl border-none shadow-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black">Как попасть в салон?</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Отправьте ваш email администратору салона. Он добавит вас в команду.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 mt-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Ваш email</p>
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary border border-border">
                                <p className="flex-1 text-sm font-bold truncate">{user?.email}</p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={handleCopyEmail}
                                >
                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                После того как администратор добавит вас, <strong>обновите страницу</strong> — и вы сразу попадёте в салон.
                            </p>
                        </div>

                        <Button
                            className="w-full mt-2 btn-primary-gradient h-11 rounded-xl font-bold"
                            onClick={() => setShowInviteInfo(false)}
                        >
                            Понятно
                        </Button>
                    </DialogContent>
                </Dialog>

                <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-center text-muted-foreground mb-2">
                        Зарегистрированы как: <strong>{user?.email}</strong>
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-destructive"
                        onClick={() => signOut()}
                    >
                        Выйти из аккаунта
                    </Button>
                </div>
            </div>
        </div>
    );
}
