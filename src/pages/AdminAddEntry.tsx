import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, ArrowLeft, Euro, CreditCard, X, Search, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ServiceChips } from '@/components/ServiceChips';
import { PaymentTabs } from '@/components/PaymentTabs';
import { useAdminEntries } from '@/hooks/useAdminEntries';
import { useMasters } from '@/hooks/useMasters';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useClients } from '@/hooks/useClients';
import { useWorkspace } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAddEntry() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { masters } = useMasters();
  const { isAdmin } = useWorkspace();

  // Get master and date from URL or state
  const [masterId, setMasterId] = useState<string | null>(searchParams.get('master'));
  const [selectedDate, setSelectedDate] = useState<Date>(
    searchParams.get('date') ? parseISO(searchParams.get('date')!) : new Date()
  );

  const selectedMaster = masters.find(m => m.user_id === masterId);
  const isIndividualPercent = selectedMaster?.percent_type === 'individual';

  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');

  const { addEntry, updateEntry, checkOverlap } = useAdminEntries(masterId, selectedDate);

  const [service, setService] = useState('');
  const [price, setPrice] = useState('');
  const [tips, setTips] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [tipsPaymentMethod, setTipsPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [masterRevenueShare, setMasterRevenueShare] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false); // Only for editing state
  const [transactionType, setTransactionType] = useState<'service' | 'debt_salon_to_master' | 'debt_master_to_salon'>('service');
  const [clientSelectionMode, setClientSelectionMode] = useState<'manual' | 'list'>('list');
  const [searchClientQuery, setSearchClientQuery] = useState('');

  const { clients } = useClients();

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchClientQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchClientQuery))
  );

  // Fetch entry data if in edit mode
  useEffect(() => {
    const fetchEntry = async () => {
      if (!id) return;

      setLoadingEntry(true);
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setMasterId(data.user_id);
          setSelectedDate(parseISO(data.date));
          setTransactionType(data.transaction_type as any || 'service');

          if (data.transaction_type === 'service') {
            setService(data.service);
            setPrice(data.price.toString());
            setTips(data.tips?.toString() || '');
            setPaymentMethod(data.payment_method as any);
            setTipsPaymentMethod(data.tips_payment_method as any);
            setStartTime(data.start_time || '10:00');
            setEndTime(data.end_time || '11:00');
            setClientName(data.client_name);
            setClientId(data.client_id || null);
            setMasterRevenueShare((data as any).master_revenue_share?.toString() || '');
          } else {
            setService(data.service); // Description for debt
            setPrice(data.price.toString());
            // No client or time for debt usually, but better safe
          }
        }
      } catch (error) {
        console.error('Error fetching entry:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные записи',
          variant: 'destructive',
        });
        navigate('/admin/calendar');
      } finally {
        setLoadingEntry(false);
      }
    };

    fetchEntry();
  }, [id, navigate, toast]);


  const handleSubmit = async () => {
    if (!service || !price || !masterId) {
      if (transactionType === 'service' && !paymentMethod) {
        toast({
          title: 'Заполните поля',
          description: 'Услуга, стоимость и способ оплаты обязательны',
          variant: 'destructive',
        });
        return;
      }
      if (transactionType === 'service' && (!service || !price || !masterId)) {
        toast({
          title: 'Заполните поля',
          description: 'Услуга и стоимость обязательны',
          variant: 'destructive',
        });
        return;
      }
    }

    if (transactionType === 'service' && !paymentMethod) {
      toast({
        title: 'Заполните поля',
        description: 'Способ оплаты обязателен',
        variant: 'destructive',
      });
      return;
    }

    // Validate tips payment method
    if (transactionType === 'service' && Number(tips) > 0 && !tipsPaymentMethod) {
      toast({
        title: 'Ошибка',
        description: 'Выберите способ оплаты чаевых',
        variant: 'destructive',
      });
      return;
    }

    // Validate individual percentage
    if (transactionType === 'service' && isIndividualPercent && !masterRevenueShare) {
      toast({
        title: 'Ошибка',
        description: 'Укажите индивидуальный процент для этого мастера',
        variant: 'destructive',
      });
      return;
    }

    // Check for overlap (exclude current entry if editing)
    if (transactionType === 'service' && checkOverlap(format(selectedDate, 'yyyy-MM-dd'), startTime, endTime, id)) {
      toast({
        title: 'Ошибка',
        description: 'Это время уже занято другой записью у этого мастера',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const entryData = {
      service,
      price: Number(price),
      tips: Number(tips) || 0,
      payment_method: transactionType === 'service'
        ? (paymentMethod as 'cash' | 'card')
        : (transactionType === 'debt_salon_to_master' ? 'card' : 'cash'),
      transaction_type: transactionType,
      tips_payment_method: tipsPaymentMethod,
      client_name: clientName,
      client_id: clientId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      user_id: masterId, // Ensure user_id is set/updated
      master_revenue_share: masterRevenueShare ? Number(masterRevenueShare) : null
    };

    let error;
    if (id) {
      const result = await updateEntry(id, entryData);
      error = result.error;
    } else {
      const result = await addEntry(entryData, masterId);
      error = result.error;
    }

    setSubmitting(false);

    if (error) {
      toast({
        title: 'Ошибка',
        description: id ? 'Не удалось обновить запись' : 'Не удалось добавить запись',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Готово',
        description: id ? 'Запись обновлена' : 'Запись добавлена',
      });
      navigate(`/admin/calendar?master=${masterId}&date=${format(selectedDate, 'yyyy-MM-dd')}`);
    }
  };

  if (loadingEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="w-10" /> {/* Spacer */}
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">
              {id ? 'Редактировать запись' : 'Новая запись'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedMaster?.master_name} • {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/calendar?master=${masterId}`)}
            className="rounded-full h-12 w-12 hover:bg-secondary/80"
          >
            <X size={28} className="text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 py-6 space-y-6">
        {/* Transaction Type Toggle */}
        <div className="grid grid-cols-2 p-1 bg-secondary rounded-xl">
          <button
            type="button"
            onClick={() => setTransactionType('service')}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${transactionType === 'service'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Клиент
          </button>
          <button
            type="button"
            onClick={() => setTransactionType('debt_salon_to_master')}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${transactionType !== 'service'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Долг / Корректировка
          </button>
        </div>

        {/* Start and End Time - Only for service transactions */}
        {transactionType === 'service' && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="startTime" className="text-sm font-medium">Начало</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="endTime" className="text-sm font-medium">Окончание</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        )}

        {/* Client Selection */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between px-1">
            <Label className="text-sm font-bold">Клиент</Label>
            <div className="flex p-0.5 bg-secondary rounded-lg">
              <button
                type="button"
                onClick={() => setClientSelectionMode('list')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${clientSelectionMode === 'list'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Из списка
              </button>
              <button
                type="button"
                onClick={() => setClientSelectionMode('manual')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${clientSelectionMode === 'manual'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Новый
              </button>
            </div>
          </div>

          {clientSelectionMode === 'manual' ? (
            <Input
              id="clientName"
              type="text"
              placeholder="Введите имя клиента..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="h-12"
            />
          ) : (
            <div className="space-y-2 relative">
              {!clientName && (
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                  <Input
                    placeholder="Поиск в базе..."
                    className="pl-10 h-12 rounded-2xl bg-card border-none shadow-sm focus-visible:ring-primary/20"
                    value={searchClientQuery}
                    onChange={(e) => setSearchClientQuery(e.target.value)}
                  />
                </div>
              )}

              {searchClientQuery && filteredClients.length > 0 && !clientName && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClientName(c.name);
                          setClientId(c.id);
                          setSearchClientQuery('');
                          toast({
                            title: 'Клиент выбран',
                            description: c.name,
                          });
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{c.name}</div>
                            {isAdmin && c.phone && (
                              <div className="text-[10px] text-muted-foreground">
                                {c.phone.split(',')[0].split(':').pop()?.trim()}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {clientName && (
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{clientName}</div>
                      <div className="text-[10px] text-primary/60 font-medium">Выбран из базы</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setClientName('');
                      setClientId(null);
                      setSearchClientQuery('');
                    }}
                    className="h-8 w-8 rounded-full"
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {transactionType === 'service' ? 'Услуга' : 'Описание (за что)'}
          </Label>
          {transactionType === 'service' ? (
            <ServiceChips selected={service} onChange={setService} userId={masterId || undefined} />
          ) : (
            <Input
              placeholder="Например: Ресницы для админа"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="h-12"
            />
          )}
        </div>

        {/* Price & Payment Method */}
        <div className="flex gap-3">
          <div className="w-[30%] space-y-2">
            <Label htmlFor="price" className="text-sm font-medium text-foreground">
              {transactionType === 'service' ? 'Стоимость' : 'Сумма'}
            </Label>
            <Input
              id="price"
              type="number"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="text-lg h-12"
            />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <Label className="text-sm font-medium text-foreground">
              {transactionType === 'service' ? 'Оплата' : 'Кто кому должен'}
            </Label>
            {transactionType === 'service' ? (
              <div className="h-12">
                <PaymentTabs selected={paymentMethod} onChange={setPaymentMethod} className="h-full" />
              </div>
            ) : (
              <div className="flex gap-2 h-12">
                <button
                  type="button"
                  onClick={() => setTransactionType('debt_salon_to_master')}
                  className={`flex-1 rounded-xl text-xs sm:text-xs font-medium leading-tight transition-all border-2 ${transactionType === 'debt_salon_to_master'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-transparent bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                >
                  Салон мне
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('debt_master_to_salon')}
                  className={`flex-1 rounded-xl text-xs sm:text-xs font-medium leading-tight transition-all border-2 ${transactionType === 'debt_master_to_salon'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-transparent bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                >
                  Я салону
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        {transactionType === 'service' && (
          <div className="flex gap-3">
            <div className="w-[30%] space-y-2">
              <Label htmlFor="tips" className="text-sm font-medium text-foreground">
                Чаевые
              </Label>
              <Input
                id="tips"
                type="number"
                placeholder="0"
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <Label className="text-sm font-medium text-foreground">Оплата</Label>
              <div className="h-12 flex gap-1 p-1 bg-secondary rounded-xl">
                <button
                  type="button"
                  onClick={() => setTipsPaymentMethod('cash')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-1 rounded-lg font-medium transition-all duration-200 ${tipsPaymentMethod === 'cash'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Euro className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">Наличные</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipsPaymentMethod('card')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-1 rounded-lg font-medium transition-all duration-200 ${tipsPaymentMethod === 'card'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">Карта</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Master Custom Percentage Override */}
        {transactionType === 'service' && isAdmin && (
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Label htmlFor="masterShare" className="text-sm font-bold text-primary flex items-center gap-2">
              <Euro size={14} /> {isIndividualPercent ? 'Процент за запись' : 'Изменить % мастера для этой записи'}
            </Label>
            <Input
              id="masterShare"
              type="number"
              min="0"
              max="100"
              placeholder={isIndividualPercent ? "Введите процент (%)" : "Оставьте пустым для стандарта или % клиента"}
              value={masterRevenueShare}
              onChange={(e) => setMasterRevenueShare(e.target.value)}
              className={cn(
                "h-12 focus-visible:ring-primary/30",
                isIndividualPercent ? "border-amber-400 bg-amber-50/30" : "border-primary/20 bg-primary/5"
              )}
              required={isIndividualPercent!}
            />
            {isIndividualPercent && (
              <p className="text-[10px] text-amber-600 font-medium ml-1">
                Для этого мастера установлен ручной ввод процента.
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className={cn(
            'w-full h-14 text-lg font-semibold rounded-2xl',
            'bg-primary hover:bg-primary/90 text-primary-foreground'
          )}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            id ? 'Сохранить изменения' : 'Добавить запись'
          )}
        </Button>
      </div>


    </div>
  );
}
