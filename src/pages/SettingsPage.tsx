import { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, Loader2, Save, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useProfessions } from '@/hooks/useProfessions';

import { useUserRole } from '@/hooks/useUserRole';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { professions, addProfession, deleteProfession } = useProfessions();

  const [masterName, setMasterName] = useState('');
  const [masterProfession, setMasterProfession] = useState('');
  const [newProfession, setNewProfession] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setMasterName(settings.master_name || '');
      setMasterProfession(settings.master_profession || '');
    }
  }, [settings]);

  const handleAddProfession = async () => {
    if (!newProfession.trim()) return;

    await addProfession(newProfession.trim());
    setNewProfession('');
    toast({
      title: 'Успешно',
      description: 'Профессия добавлена',
    });
  };

  const handleDeleteProfession = async (id: string) => {
    await deleteProfession(id);
    toast({
      title: 'Успешно',
      description: 'Профессия удалена',
    });
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await updateSettings({
      master_name: masterName,
      master_profession: masterProfession,
    });

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Сохранено!',
        description: 'Настройки обновлены',
      });
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard', { state: { direction: 'back' } })}
          className="rounded-xl h-10 w-10"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-display font-bold text-foreground">
          Настройки
        </h1>
      </header>

      <div className="px-5 space-y-4 animate-slide-up">
        {/* Master Name */}
        <div className="space-y-1.5 animate-fade-in">
          <Label htmlFor="masterName" className="text-sm font-medium">
            Имя мастера
          </Label>
          <Input
            id="masterName"
            type="text"
            placeholder="Как вас зовут?"
            value={masterName}
            onChange={(e) => setMasterName(e.target.value)}
            className="input-beauty h-12"
          />
        </div>

        {/* Master Profession Selection */}
        <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Label htmlFor="masterProfession" className="text-sm font-medium">
            Профессия / Специализация
          </Label>
          <Select value={masterProfession} onValueChange={setMasterProfession}>
            <SelectTrigger className="w-full h-12 input-beauty">
              <SelectValue placeholder="Выберите специализацию" />
            </SelectTrigger>
            <SelectContent>
              {professions.map((prof) => (
                <SelectItem key={prof.id} value={prof.name}>
                  {prof.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Admin Section: Manage Professions */}
        {isAdmin && (
          <div className="pt-4 border-t border-border/50 animate-fade-in" style={{ animationDelay: '0.15s' }}>
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
                <Button
                  size="sm"
                  className="h-10 px-4"
                  onClick={handleAddProfession}
                  disabled={!newProfession.trim()}
                >
                  <Plus size={18} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {professions.map((prof) => (
                  <div key={prof.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border/50 text-xs font-medium">
                    <span>{prof.name}</span>
                    <button
                      onClick={() => handleDeleteProfession(prof.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={handleSave}
            className="w-full h-12 btn-primary-gradient rounded-xl text-base"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </>
            )}
          </Button>
        </div>

        {/* Sign Out */}
        <div className="pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти из аккаунта
          </Button>
        </div>
      </div>


    </div>
  );
}
