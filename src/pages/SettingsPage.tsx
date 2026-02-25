import { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, Loader2, Save, Copy, Check, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
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
import { useWorkspace } from '@/hooks/useWorkspace';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin, activeWorkspace, refreshWorkspaces } = useWorkspace();
  const { professions } = useProfessions();
  const { theme, setTheme } = useTheme();

  const [masterName, setMasterName] = useState('');
  const [masterProfession, setMasterProfession] = useState('');
  const [salonName, setSalonName] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Копия создана',
        description: 'Email скопирован в буфер обмена',
      });
    }
  };

  useEffect(() => {
    if (settings) {
      setMasterName(settings.master_name || '');
      setMasterProfession(settings.master_profession || '');
    }
  }, [settings]);

  useEffect(() => {
    if (activeWorkspace?.workspace?.name) {
      setSalonName(activeWorkspace.workspace.name);
    }
  }, [activeWorkspace?.workspace?.name]);



  const handleSave = async () => {
    setSaving(true);
    let hasError = false;

    // 1. Admin saves salon name
    if (isAdmin && salonName !== activeWorkspace?.workspace?.name) {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('workspaces')
        .update({ name: salonName })
        .eq('id', activeWorkspace?.workspace_id);

      if (error) {
        hasError = true;
      } else {
        refreshWorkspaces?.();
      }
    }

    // 2. ALL roles (including admins) save their personal master profile
    const { error: profileError } = await updateSettings({
      master_name: masterName,
      master_profession: masterProfession,
    });

    if (profileError) hasError = true;

    if (hasError) {
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
        {isAdmin && (
          // Admin View: Edit Salon info
          <div className="space-y-1.5 animate-fade-in mb-6 pb-6 border-b border-border/50">
            <Label htmlFor="salonName" className="text-sm font-medium flex items-center gap-2">
              Название салона
            </Label>
            <Input
              id="salonName"
              type="text"
              placeholder="Введите название салона..."
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="input-beauty h-12 text-base font-semibold"
            />
          </div>
        )}

        {/* Master View: Edit Personal profile (shown for everyone) */}
        <>
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
                {professions.length === 0 && (
                  <SelectItem value="Мастер">Мастер</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Email info block */}
          <div className="pt-2 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <Label className="text-sm font-medium text-foreground mb-1 block">
                Ваш Email
              </Label>
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-primary mb-2">
                  {user?.email}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyEmail}
                  className="h-8 w-8 text-muted-foreground hover:text-primary mb-2 transition-colors duration-200"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                По этому email адресу администраторы других салонов могут выслать вам приглашение для присоединения к их команде.
              </p>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="pt-2 animate-fade-in" style={{ animationDelay: '0.18s' }}>
            <Label className="text-sm font-medium mb-2 block">Внешний вид</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
              >
                <Sun size={20} className="mb-2" />
                <span className="text-xs font-medium">Светлая</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
              >
                <Moon size={20} className="mb-2" />
                <span className="text-xs font-medium">Тёмная</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
              >
                <Monitor size={20} className="mb-2" />
                <span className="text-xs font-medium">Системная</span>
              </button>
            </div>
          </div>
        </>

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
