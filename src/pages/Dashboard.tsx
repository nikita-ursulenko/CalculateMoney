import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BottomNav } from '@/components/BottomNav';
import { EntryCard } from '@/components/EntryCard';
import { useSettings } from '@/hooks/useSettings';
import { useEntries } from '@/hooks/useEntries';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { settings, loading: settingsLoading } = useSettings();
  const { entries, loading: entriesLoading, deleteEntry } = useEntries(selectedDate);
  const { toast } = useToast();

  const loading = settingsLoading || entriesLoading;

  // Get rates from settings
  const rateCash = settings?.use_different_rates 
    ? Number(settings.rate_cash) 
    : Number(settings?.rate_general || 40);
  const rateCard = settings?.use_different_rates 
    ? Number(settings.rate_card) 
    : Number(settings?.rate_general || 40);

  // Calculate daily balance
  const dailyStats = entries.reduce(
    (acc, entry) => {
      const price = Number(entry.price);
      const tips = Number(entry.tips);
      const isCash = entry.payment_method === 'cash';
      const rate = isCash ? rateCash : rateCard;

      // Balance calculation
      const balanceChange = isCash 
        ? -(price * (1 - rate / 100))
        : price * (rate / 100);

      // Income = commission + tips
      const income = isCash 
        ? (price * rate / 100) + tips
        : (price * rate / 100) + tips;

      return {
        balance: acc.balance + balanceChange,
        income: acc.income + income,
        tipsTotal: acc.tipsTotal + tips,
      };
    },
    { balance: 0, income: 0, tipsTotal: 0 }
  );

  const isPositiveBalance = dailyStats.balance >= 0;

  const handleDeleteEntry = async (id: string) => {
    const { error } = await deleteEntry(id);
    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить запись',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Готово',
        description: 'Запись удалена',
      });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-display font-bold text-foreground animate-fade-in">
          Привет, {settings?.master_name || 'Мастер'} 👋
        </h1>
      </header>

      {/* Date Selector */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between bg-card rounded-xl p-2 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('prev')}
            className="rounded-lg"
          >
            <ChevronLeft size={20} />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="font-medium text-foreground hover:bg-secondary"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ru}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('next')}
            className="rounded-lg"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-5 mb-6">
        <div className={cn(
          'balance-card animate-scale-in',
          isPositiveBalance ? 'balance-positive' : 'balance-negative'
        )}>
          <p className="text-sm text-muted-foreground mb-2">Баланс дня</p>
          <p className={cn(
            'text-3xl font-bold mb-3',
            isPositiveBalance ? 'text-success' : 'text-destructive'
          )}>
            {isPositiveBalance ? (
              <>Салон должен тебе: €{dailyStats.balance.toFixed(2)}</>
            ) : (
              <>Ты должна салону: €{Math.abs(dailyStats.balance).toFixed(2)}</>
            )}
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm">
            <TrendingUp size={16} className="text-success" />
            <span className="text-success font-medium">
              Твой доход сегодня: €{dailyStats.income.toFixed(2)}
            </span>
            {dailyStats.tipsTotal > 0 && (
              <span className="text-muted-foreground">
                (чаевые: €{dailyStats.tipsTotal.toFixed(2)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="px-5">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Записи за день
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <p className="text-lg mb-2">Нет записей</p>
            <p className="text-sm">Нажмите + чтобы добавить первую запись</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                rateCash={rateCash}
                rateCard={rateCard}
                onDelete={handleDeleteEntry}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
