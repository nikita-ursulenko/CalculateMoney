import { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BottomNav } from '@/components/BottomNav';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const [masterName, setMasterName] = useState('');
  const [useDifferentRates, setUseDifferentRates] = useState(false);
  const [rateGeneral, setRateGeneral] = useState('40');
  const [rateCash, setRateCash] = useState('40');
  const [rateCard, setRateCard] = useState('40');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setMasterName(settings.master_name || '');
      setUseDifferentRates(settings.use_different_rates);
      setRateGeneral(String(settings.rate_general));
      setRateCash(String(settings.rate_cash));
      setRateCard(String(settings.rate_card));
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);

    const { error } = await updateSettings({
      master_name: masterName,
      use_different_rates: useDifferentRates,
      rate_general: parseFloat(rateGeneral) || 40,
      rate_cash: parseFloat(rateCash) || 40,
      rate_card: parseFloat(rateCard) || 40,
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
          onClick={() => navigate('/dashboard')}
          className="rounded-xl h-10 w-10"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-display font-bold text-foreground">
          Настройки
        </h1>
      </header>

      <div className="px-5 space-y-4">
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

        {/* Rate Toggle */}
        <div className="bg-card rounded-xl p-4 space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Разный процент</p>
              <p className="text-sm text-muted-foreground">
                Для наличных и карты
              </p>
            </div>
            <Switch
              checked={useDifferentRates}
              onCheckedChange={setUseDifferentRates}
            />
          </div>

          {useDifferentRates ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="rateCash" className="text-sm">
                  Процент для наличных (%)
                </Label>
                <Input
                  id="rateCash"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.1"
                  value={rateCash}
                  onChange={(e) => setRateCash(e.target.value)}
                  className="input-beauty h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rateCard" className="text-sm">
                  Процент для карты (%)
                </Label>
                <Input
                  id="rateCard"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.1"
                  value={rateCard}
                  onChange={(e) => setRateCard(e.target.value)}
                  className="input-beauty h-12"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <Label htmlFor="rateGeneral" className="text-sm">
                Общий процент (%)
              </Label>
              <Input
                id="rateGeneral"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.1"
                value={rateGeneral}
                onChange={(e) => setRateGeneral(e.target.value)}
                className="input-beauty h-12"
              />
            </div>
          )}
        </div>

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

      <BottomNav />
    </div>
  );
}
