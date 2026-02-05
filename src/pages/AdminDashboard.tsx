import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { CalendarIcon, ChevronLeft, ChevronRight, TrendingUp, Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BottomNav } from '@/components/BottomNav';
import { EntryCard } from '@/components/EntryCard';
import { ExportMenu } from '@/components/ExportMenu';
import { MasterSelector } from '@/components/MasterSelector';
import { useMasters, Master } from '@/hooks/useMasters';
import { useAdminEntries } from '@/hooks/useAdminEntries';
import { useExportData } from '@/hooks/useExportData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { masters, loading: mastersLoading } = useMasters();
  const { toast } = useToast();
  const { exportToPDF } = useExportData();

  // Selected master state
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(() => {
    return searchParams.get('master') || null;
  });

  // Date state
  const [selectedDate, setSelectedDate] = useState<DateRange | undefined>(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (fromParam) {
      return {
        from: parseISO(fromParam),
        to: toParam ? parseISO(toParam) : undefined,
      };
    }



    return {
      from: new Date(),
      to: undefined,
    };
  });

  const [showIncome, setShowIncome] = useState(true);

  // Fetch entries for selected master
  const { entries, loading: entriesLoading, deleteEntry } = useAdminEntries(selectedMasterId, selectedDate);

  // Get selected master's settings
  const selectedMaster = masters.find(m => m.user_id === selectedMasterId);

  // Auto-select first master when loaded
  useEffect(() => {
    if (!selectedMasterId && masters.length > 0) {
      setSelectedMasterId(masters[0].user_id);
    }
  }, [masters, selectedMasterId]);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedMasterId) {
      params.set('master', selectedMasterId);
    }
    if (selectedDate?.from) {
      params.set('from', format(selectedDate.from, 'yyyy-MM-dd'));
    }
    if (selectedDate?.to) {
      params.set('to', format(selectedDate.to, 'yyyy-MM-dd'));
    }
    setSearchParams(params, { replace: true });


  }, [selectedMasterId, selectedDate, setSearchParams]);

  const loading = mastersLoading || entriesLoading;

  // Get rates from selected master's settings
  const rateCash = selectedMaster?.use_different_rates
    ? selectedMaster.rate_cash
    : selectedMaster?.rate_general || 40;
  const rateCard = selectedMaster?.use_different_rates
    ? selectedMaster.rate_card
    : selectedMaster?.rate_general || 40;

  // Calculate daily balance
  const dailyStats = entries.reduce(
    (acc, entry) => {
      const price = Number(entry.price);
      const tips = Number(entry.tips);
      const isCash = entry.payment_method === 'cash';
      const role = entry.recipient_role || 'me';
      const type = entry.transaction_type || 'service';

      if (type === 'debt_salon_to_master') {
        return {
          ...acc,
          balance: acc.balance + price,
          income: acc.income + price,
        };
      }

      if (type === 'debt_master_to_salon') {
        return {
          ...acc,
          balance: acc.balance - price,
          salonIncome: (acc.salonIncome || 0) + price,
        };
      }

      const actsLikeCard = !isCash || role === 'admin';
      const rate = actsLikeCard ? rateCard : rateCash;
      const tipsPaymentMethod = entry.tips_payment_method || 'cash';

      const serviceBalance = actsLikeCard
        ? price * (rate / 100)
        : -(price * (1 - rate / 100));

      const tipsBalance = tipsPaymentMethod === 'cash'
        ? 0
        : tips * (rateCard / 100);

      const balanceChange = serviceBalance + tipsBalance;

      const serviceIncome = price * (rate / 100);
      const tipsIncome = tipsPaymentMethod === 'cash'
        ? tips
        : tips * (rateCard / 100);

      const income = serviceIncome + tipsIncome;

      // Calculate Salon's Income (User wants "Ваш доход")
      // Salon gets whatever Master doesn't get from the service price.
      // Master Rate is `rate`. Salon Rate is `100 - rate`.
      const salonShare = price * (1 - rate / 100);

      // Calculate Card Tips (User: "не показывай чай если чай были наличными")
      // If payment is card, tips are card tips.
      const cardTips = tipsPaymentMethod === 'card' ? tips : 0;

      const recipientKey = role === 'master' ? entry.recipient_name : null;
      const newRecipients = { ...acc.recipients };
      if (recipientKey && isCash) {
        newRecipients[recipientKey] = (newRecipients[recipientKey] || 0) + price;
      }

      return {
        balance: acc.balance + balanceChange,
        income: acc.income + income,
        tipsTotal: acc.tipsTotal + tipsIncome,
        recipients: newRecipients,
        salonIncome: (acc.salonIncome || 0) + salonShare,
        cardTips: (acc.cardTips || 0) + cardTips,
      };
    },
    { balance: 0, income: 0, tipsTotal: 0, recipients: {} as Record<string, number>, salonIncome: 0, cardTips: 0 }
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
    if (selectedDate?.from && selectedDate?.to) {
      setSelectedDate({ from: selectedDay, to: undefined });
      return;
    }

    if (!range?.from) {
      setSelectedDate({ from: selectedDay, to: undefined });
      return;
    }

    if (range.to && isSameDay(range.from, range.to)) {
      setSelectedDate({ from: range.from, to: undefined });
    } else {
      setSelectedDate(range);
    }
  };

  const handleAddEntry = () => {
    if (!selectedMasterId) {
      toast({
        title: 'Выберите мастера',
        description: 'Сначала выберите мастера для добавления записи',
        variant: 'destructive',
      });
      return;
    }
    const targetDate = selectedDate?.from || new Date();
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    navigate(`/admin/add?date=${dateStr}&master=${selectedMasterId}`);
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Admin Header */}
      <div className="pt-6 px-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Админ-панель</h1>
        </div>

        {/* Master Selector */}
        <MasterSelector
          masters={masters}
          selectedMasterId={selectedMasterId}
          onSelectMaster={setSelectedMasterId}
          loading={mastersLoading}
        />
      </div>

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
      {selectedMaster && (
        <div className="px-5 mb-4">
          <div className={cn(
            'balance-card animate-slide-up relative bg-card',
            isPositiveBalance ? 'balance-positive' : 'balance-negative'
          )}>
            <div className="absolute top-2 right-2 flex gap-2">
              <ExportMenu
                onExportPDF={() => exportToPDF(entries, selectedDate || { from: new Date() }, dailyStats, rateCash, rateCard, selectedMaster.master_name)}
                disabled={entries.length === 0}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/50 hover:text-foreground transition-transform hover:scale-105"
                onClick={() => setShowIncome(!showIncome)}
              >
                {showIncome ? <Eye size={18} /> : <EyeOff size={18} />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mb-1">{selectedMaster.master_name}</p>
            <p className={cn(
              'text-3xl font-bold mb-3 transition-colors duration-500',
              // Invert Logic for Admin: 
              // If dailyStats.balance < 0 (Master owes Salon) -> Admin sees Positive (Green)
              // If dailyStats.balance > 0 (Salon owes Master) -> Admin sees Negative (Red)
              dailyStats.balance <= 0 ? 'text-success' : 'text-destructive'
            )}>
              {dailyStats.balance <= 0 ? (
                // Master owes Salon (e.g. -100 for Master -> +100 for Salon)
                <>Мастер должен: €{Math.abs(dailyStats.balance).toFixed(2)}</>
              ) : (
                // Salon owes Master (e.g. +100 for Master -> -100 for Salon)
                <>Я должен: €{dailyStats.balance.toFixed(2)}</>
              )}
            </p>

            {showIncome && (
              <div className="flex flex-col items-center gap-1 animate-fade-in">
                {Object.entries(dailyStats.recipients).map(([name, amount]) => (
                  <div key={name} className="text-base text-yellow-500 font-bold mb-1 drop-shadow-md">
                    Принялa {name}: €{amount.toFixed(2)}
                  </div>
                ))}

                <div className="flex flex-col items-center gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-success" />
                    <span className="text-success font-medium">
                      Ваш доход: €{(dailyStats.salonIncome || 0).toFixed(2)}
                    </span>
                  </div>
                  {(dailyStats.cardTips || 0) > 0 && (
                    <span className="text-muted-foreground text-xs">
                      (чаевые карта: €{(dailyStats.cardTips || 0).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="px-5">
        <h2 className="text-base font-semibold mb-3 text-foreground animate-fade-in">
          Записи на {selectedDate?.to && !isSameDay(selectedDate.from!, selectedDate.to)
            ? `${format(selectedDate.from!, 'd MMM', { locale: ru })} - ${format(selectedDate.to, 'd MMM', { locale: ru })}`
            : format(selectedDate?.from || new Date(), 'EEEE, d MMMM', { locale: ru })
          }
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !selectedMaster ? (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <p className="text-base mb-1">Выберите мастера</p>
            <p className="text-xs">Используйте выпадающий список выше</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <p className="text-base mb-1">Нет записей</p>
            <p className="text-xs">Нажмите + чтобы добавить запись</p>
          </div>
        ) : (
          <div className="pb-20 space-y-3">
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
                  onClick={() => navigate(`/admin/edit/${entry.id}?master=${selectedMasterId}`)}
                  isAdminView={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav onAddClick={handleAddEntry} isAdmin />
    </div>
  );
}
