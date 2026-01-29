import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { CalendarIcon, ChevronLeft, ChevronRight, TrendingUp, Loader2, Plus, Eye, EyeOff } from 'lucide-react';
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
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  });
  const [showIncome, setShowIncome] = useState(true);
  const { settings, loading: settingsLoading } = useSettings();
  const { entries, loading: entriesLoading, deleteEntry } = useEntries(selectedDate);
  const { toast } = useToast();

  const handleAddEntry = () => {
    const targetDate = selectedDate?.from || new Date();
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    navigate(`/add?date=${dateStr}`);
  };

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

      const tipsPaymentMethod = entry.tips_payment_method || 'cash';

      // Balance calculation
      // Service part
      const serviceBalance = isCash
        ? -(price * (1 - rate / 100))
        : price * (rate / 100);

      // Tips part
      const tipsBalance = tipsPaymentMethod === 'cash'
        ? 0 // Master keeps cash tips
        : tips * (rateCard / 100); // Salon owes master percentage for card tips

      const balanceChange = serviceBalance + tipsBalance;

      // Income calculation
      const serviceIncome = price * (rate / 100);
      const tipsIncome = tipsPaymentMethod === 'cash'
        ? tips
        : tips * (rateCard / 100);

      const income = serviceIncome + tipsIncome;

      return {
        balance: acc.balance + balanceChange,
        income: acc.income + income,
        tipsTotal: acc.tipsTotal + tipsIncome,
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
    if (!selectedDate?.from) return;

    const days = direction === 'next' ? 1 : -1;
    const newFrom = addDays(selectedDate.from, days);

    let newTo = undefined;
    if (selectedDate.to) {
      newTo = addDays(selectedDate.to, days);
    }

    setSelectedDate({ from: newFrom, to: newTo });
  };

  const handleDateSelect = (range: DateRange | undefined, selectedDay: Date) => {
    // 1. If we already have a complete range (from and to), any click should start a NEW selection
    if (selectedDate?.from && selectedDate?.to) {
      setSelectedDate({ from: selectedDay, to: undefined });
      return;
    }

    // 2. If range is undefined (deselection attempt), strictly select the clicked day
    if (!range?.from) {
      setSelectedDate({ from: selectedDay, to: undefined });
      return;
    }

    // 3. If standard selection (e.g. picking second date)
    // Check if checks/logic resulted in same day for both
    if (range.to && isSameDay(range.from, range.to)) {
      setSelectedDate({ from: range.from, to: undefined });
    } else {
      setSelectedDate(range);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header removed */}
      <div className="pt-6" />

      {/* Date Selector */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between bg-card rounded-xl p-1.5 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('prev')}
            className="rounded-lg h-8 w-8"
          >
            <ChevronLeft size={18} />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="font-medium text-foreground hover:bg-secondary h-8 text-sm"
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {selectedDate?.from ? (
                  selectedDate.to && !isSameDay(selectedDate.from, selectedDate.to) ? (
                    <>
                      {format(selectedDate.from, 'd MMM', { locale: ru })} -{' '}
                      {format(selectedDate.to, 'd MMM', { locale: ru })}
                    </>
                  ) : (
                    format(selectedDate.from, 'EEEE, d MMMM', { locale: ru })
                  )
                ) : (
                  <span>Выберите дату</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="range"
                defaultMonth={selectedDate?.from}
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={ru}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('next')}
            className="rounded-lg h-8 w-8"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-5 mb-4">
        <div className={cn(
          'balance-card animate-slide-up relative bg-card', // Added animate-slide-up
          isPositiveBalance ? 'balance-positive' : 'balance-negative'
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-muted-foreground/50 hover:text-foreground transition-transform hover:scale-105"
            onClick={() => setShowIncome(!showIncome)}
          >
            {showIncome ? <Eye size={18} /> : <EyeOff size={18} />}
          </Button>

          <p className="text-sm text-muted-foreground mb-2">Баланс за период</p>
          <p className={cn(
            'text-3xl font-bold mb-3 transition-colors duration-500',
            isPositiveBalance ? 'text-success' : 'text-destructive'
          )}>
            {isPositiveBalance ? (
              <>Итого к вам: €{dailyStats.balance.toFixed(2)}</>
            ) : (
              <>Итого от вас: €{Math.abs(dailyStats.balance).toFixed(2)}</>
            )}
          </p>

          {showIncome && (
            <div className="flex items-center justify-center gap-2 text-sm animate-fade-in">
              <TrendingUp size={16} className="text-success" />
              <span className="text-success font-medium">
                Твой доход: €{dailyStats.income.toFixed(2)}
              </span>
              {dailyStats.tipsTotal > 0 && (
                <span className="text-muted-foreground">
                  (чаевые: €{dailyStats.tipsTotal.toFixed(2)})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Entries List */}
      <div className="px-5">
        <h2 className="text-base font-semibold mb-3 text-foreground animate-fade-in">
          Записи на {format(selectedDate?.from || new Date(), 'EEEE, d MMMM', { locale: ru })}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <p className="text-base mb-1">Нет записей</p>
            <p className="text-xs">Нажмите + чтобы добавить первую запись</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <EntryCard
                  entry={entry}
                  rateCash={rateCash}
                  rateCard={rateCard}
                  onDelete={handleDeleteEntry}
                  showTips={showIncome}
                  onClick={() => navigate(`/edit/${entry.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav onAddClick={handleAddEntry} />
    </div>
  );
}
