import { useState } from 'react';
import { ArrowLeft, Loader2, Plus, Trash2, Users, TrendingUp, UserPlus, Settings2, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useProfessions } from '@/hooks/useProfessions';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/use-toast';

type MemberRole = 'admin' | 'moderator' | 'master';

interface MemberSettings {
    role: MemberRole;
    manage_clients: boolean;
    manage_entries: boolean;
    view_admin_calendar: boolean;
    manage_services: boolean;
    use_different_rates: boolean;
    rate_general: number;
    rate_cash: number;
    rate_card: number;
}

export default function AdminTeam() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { activeWorkspace } = useWorkspace();
    const { professions, addProfession, deleteProfession } = useProfessions();
    const { members, updateMemberPermissions, removeMember, inviteMember, updateMemberSettings, loading } = useWorkspaceMembers();

    const [newProfession, setNewProfession] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Modal state
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [modalSettings, setModalSettings] = useState<MemberSettings | null>(null);

    const handleAddProfession = async () => {
        if (!newProfession.trim()) return;
        await addProfession(newProfession.trim());
        setNewProfession('');
        toast({ title: 'Успешно', description: 'Профессия добавлена' });
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        const { error } = await inviteMember(inviteEmail.trim());
        setInviting(false);
        if (error) {
            toast({ title: 'Ошибка', description: (error as Error).message, variant: 'destructive' });
        } else {
            setInviteEmail('');
            toast({ title: 'Мастер добавлен!', description: `${inviteEmail} успешно добавлен в команду.` });
        }
    };

    const openMemberModal = (userId: string) => {
        const member = members.find(m => m.user_id === userId);
        if (!member) return;
        setSelectedMember(userId);
        setModalSettings({
            role: (member.role as MemberRole) || 'master',
            manage_clients: member.manage_clients ?? false,
            manage_entries: (member as any).manage_entries ?? false,
            view_admin_calendar: (member as any).view_admin_calendar ?? false,
            manage_services: (member as any).manage_services ?? false,
            use_different_rates: member.settings?.use_different_rates ?? false,
            rate_general: member.settings?.rate_general ?? 40,
            rate_cash: (member.settings as any)?.rate_cash ?? 40,
            rate_card: (member.settings as any)?.rate_card ?? 40,
        });
    };

    const handleSaveMember = async () => {
        if (!selectedMember || !modalSettings) return;
        setSaving(true);

        const [permResult, rateResult] = await Promise.all([
            updateMemberPermissions(selectedMember, {
                role: modalSettings.role,
                manage_clients: modalSettings.manage_clients,
                manage_entries: modalSettings.manage_entries,
                view_admin_calendar: modalSettings.view_admin_calendar,
                manage_services: modalSettings.manage_services,
            }),
            updateMemberSettings(selectedMember, {
                use_different_rates: modalSettings.use_different_rates,
                rate_general: modalSettings.rate_general,
                rate_cash: modalSettings.rate_cash,
                rate_card: modalSettings.rate_card,
            }),
        ]);

        setSaving(false);
        if (permResult?.error || rateResult?.error) {
            toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' });
        } else {
            toast({ title: 'Сохранено!', description: 'Настройки участника обновлены' });
            setSelectedMember(null);
        }
    };

    const roleLabel = (role: string) => {
        if (role === 'admin') return 'Администратор';
        if (role === 'moderator') return 'Модератор';
        return 'Мастер';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 bg-background">
            <header className="px-5 pt-6 pb-4 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/admin', { state: { direction: 'back' } })}
                    className="rounded-xl h-10 w-10"
                >
                    <ArrowLeft size={20} />
                </Button>
                <h1 className="text-xl font-display font-bold text-foreground">Команда салона</h1>
            </header>

            <div className="px-5 space-y-6 animate-slide-up">

                {/* Invite */}
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <UserPlus size={14} />
                        Пригласить участника
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                        Участник должен сначала <strong>зарегистрироваться</strong> в приложении.
                    </p>
                    <div className="flex gap-2">
                        <Input
                            type="email"
                            placeholder="email@example.com"
                            className="h-12 text-sm"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                        />
                        <Button
                            className="h-12 px-4 btn-primary-gradient rounded-xl"
                            onClick={handleInvite}
                            disabled={!inviteEmail.trim() || inviting}
                        >
                            {inviting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        </Button>
                    </div>
                </div>

                {/* Members list */}
                <div className="pt-4 border-t border-border/50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <Users size={14} />
                        Сотрудники ({members.length})
                    </h3>

                    <div className="space-y-2">
                        {members.map((member) => {
                            const isCurrentUser = member.user_id === activeWorkspace?.user_id;
                            return (
                                <div key={member.user_id} className="flex items-center p-3 rounded-xl bg-secondary/50 border border-border/50 gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">
                                            {member.settings?.master_name || 'Без имени'}
                                            {isCurrentUser && <span className="text-muted-foreground font-normal"> (Вы)</span>}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(() => {
                                                const prof = member.settings?.master_profession;
                                                const roleLbl = roleLabel(member.role);
                                                // For 'master': just show profession + rate (no role label, it's obvious)
                                                if (member.role === 'master') {
                                                    return (
                                                        <>
                                                            <span className="text-muted-foreground">{prof || 'Без профессии'}</span>
                                                            {member.settings?.rate_general != null && (
                                                                <span className="ml-1 text-primary font-bold"> · {member.settings.rate_general}%</span>
                                                            )}
                                                        </>
                                                    );
                                                }
                                                // For admin/moderator: show role label with colour
                                                return (
                                                    <>
                                                        {prof && <>{prof}{' · '}</>}
                                                        <span className={
                                                            member.role === 'admin' ? 'text-primary font-semibold' :
                                                                'text-amber-500 font-semibold'
                                                        }>{roleLbl}</span>
                                                    </>
                                                );
                                            })()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {/* Settings modal button */}
                                        {!isCurrentUser && member.role !== 'admin' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => openMemberModal(member.user_id)}
                                            >
                                                <Settings2 size={16} />
                                            </Button>
                                        )}
                                        {!isCurrentUser && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeMember(member.user_id)}
                                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {members.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Нет участников</p>
                        )}
                    </div>
                </div>

                {/* Professions */}
                <div className="pt-4 border-t border-border/50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <TrendingUp size={14} />
                        Справочник профессий
                    </h3>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Новая профессия..."
                                className="h-10 text-sm"
                                value={newProfession}
                                onChange={(e) => setNewProfession(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddProfession()}
                            />
                            <Button size="sm" className="h-10 px-4" onClick={handleAddProfession} disabled={!newProfession.trim()}>
                                <Plus size={18} />
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {professions.map((prof) => (
                                <div key={prof.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border/50 text-xs font-medium">
                                    <span className="truncate pr-2">{prof.name}</span>
                                    <button onClick={() => deleteProfession(prof.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors shrink-0">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Member Settings Modal */}
            <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <DialogContent className="sm:max-w-sm rounded-3xl border-none shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            {members.find(m => m.user_id === selectedMember)?.settings?.master_name || 'Настройки участника'}
                        </DialogTitle>
                    </DialogHeader>

                    {modalSettings && (
                        <div className="space-y-5 mt-2">

                            {/* Role selector */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Роль</Label>
                                <Select
                                    value={modalSettings.role}
                                    onValueChange={(v) => setModalSettings(prev => prev ? { ...prev, role: v as MemberRole } : prev)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="master">Мастер</SelectItem>
                                        <SelectItem value="moderator">Модератор</SelectItem>
                                    </SelectContent>
                                </Select>
                                {modalSettings.role === 'moderator' && (
                                    <p className="text-[10px] text-amber-500">
                                        Модератор видит раздел "Администрирование" и имеет доступ к выбранным функциям ниже.
                                    </p>
                                )}
                            </div>

                            {/* Percentages: with toggle for split rates */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                                        <Percent size={10} /> Процент от выручки
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground">Раздельный</span>
                                        <Switch
                                            checked={modalSettings.use_different_rates}
                                            onCheckedChange={(v) => setModalSettings(prev => prev ? { ...prev, use_different_rates: v } : prev)}
                                        />
                                    </div>
                                </div>

                                {modalSettings.use_different_rates ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'rate_cash', label: 'Наличные' },
                                            { key: 'rate_card', label: 'Карта' },
                                        ].map(({ key, label }) => (
                                            <div key={key} className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground text-center">{label}</p>
                                                <div className="flex items-center">
                                                    <Input
                                                        type="number" min={0} max={100}
                                                        value={(modalSettings as any)[key]}
                                                        onChange={(e) => setModalSettings(prev => prev ? { ...prev, [key]: Number(e.target.value) } : prev)}
                                                        className="h-10 font-bold text-center text-base px-1"
                                                    />
                                                    <span className="text-xs text-muted-foreground ml-0.5">%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number" min={0} max={100}
                                            value={modalSettings.rate_general}
                                            onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setModalSettings(prev => prev ? { ...prev, rate_general: v, rate_cash: v, rate_card: v } : prev);
                                            }}
                                            className="h-11 w-28 font-bold text-center text-lg"
                                        />
                                        <span className="text-base text-muted-foreground">%</span>
                                        <span className="text-[10px] text-muted-foreground">применяется ко всем типам оплат</span>
                                    </div>
                                )}
                            </div>

                            {/* Permissions */}
                            <div className="space-y-3 border-t border-border/50 pt-4">
                                <Label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Разрешения</Label>

                                {[
                                    { key: 'manage_clients', label: 'Управление клиентами', desc: 'Добавлять, редактировать и удалять клиентов' },
                                    { key: 'manage_entries', label: 'Управление записями', desc: 'Добавлять/редактировать записи всех мастеров' },
                                    { key: 'view_admin_calendar', label: 'Календарь мастеров', desc: 'Просматривать расписание всей команды' },
                                    { key: 'manage_services', label: 'Управление услугами', desc: 'Добавлять и редактировать услуги салона' },
                                ].map(({ key, label, desc }) => (
                                    <div key={key} className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">{label}</p>
                                            <p className="text-[10px] text-muted-foreground">{desc}</p>
                                        </div>
                                        <Switch
                                            checked={(modalSettings as any)[key]}
                                            onCheckedChange={(checked) =>
                                                setModalSettings(prev => prev ? { ...prev, [key]: checked } : prev)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Save */}
                            <Button
                                onClick={handleSaveMember}
                                disabled={saving}
                                className="w-full h-12 btn-primary-gradient rounded-xl font-bold text-base"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : 'Сохранить'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
