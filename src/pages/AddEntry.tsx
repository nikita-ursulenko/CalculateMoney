import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Loader2, Euro, CreditCard, X, Search, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ServiceChips } from '@/components/ServiceChips';
import { PaymentTabs } from '@/components/PaymentTabs';
import { useEntries } from '@/hooks/useEntries';
import { useToast } from '@/hooks/use-toast';

import { useUserRole } from '@/hooks/useUserRole';

export default function AddEntry() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<Date>(
    dateParam ? parse(dateParam, 'yyyy-MM-dd', new Date()) : new Date()
  );

  const navigate = useNavigate();
  const { addEntry, updateEntry } = useEntries();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const [service, setService] = useState('');
  const [price, setPrice] = useState('');
  const [tips, setTips] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [tipsPaymentMethod, setTipsPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipientRole, setRecipientRole] = useState<'me' | 'master' | 'admin'>('me');
  const [recipientName, setRecipientName] = useState('');
  const [transactionType, setTransactionType] = useState<'service' | 'debt_salon_to_master' | 'debt_master_to_salon'>('service');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [clientSelectionMode, setClientSelectionMode] = useState<'manual' | 'list'>('list');
  const [searchClientQuery, setSearchClientQuery] = useState('');

  // Real apps would fetch this from Supabase. Using the same mock for consistency.
  const [clients] = useState([
    { id: '1', name: 'Анна Петрова', phone: '+7 900 123-45-67' },
    { id: '2', name: 'Елена Сидорова', phone: '+7 900 765-43-21' },
    { id: '3', name: 'Мария Иванова', phone: '+7 900 111-22-33' },
    { id: '4', name: 'Ольга Кузнецова', phone: '+7 900 444-55-66' },
    { id: '5', name: 'Светлана Попова', phone: '+7 900 999-88-77' },
  ]);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchClientQuery.toLowerCase()) ||
    c.phone.includes(searchClientQuery)
  );

  // Load existing data if editing
  useEffect(() => {
    if (!id) return;

    const fetchEntry = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: 'Ошибка loading',
          description: 'Не удалось загрузить запись',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      if (data) {
        const entry = data as any; // Cast to any to bypass outdated Supabase types
        setService(entry.service);
        setPrice(entry.price.toString());
        setTips(entry.tips > 0 ? entry.tips.toString() : '');
        setPaymentMethod(entry.payment_method as 'cash' | 'card');
        setTipsPaymentMethod((entry.tips_payment_method as 'cash' | 'card') || null);
        setClientName(entry.client_name || '');
        setSelectedDate(new Date(entry.date));
        setRecipientRole((entry.recipient_role as 'me' | 'master' | 'admin') || 'me');
        setRecipientName(entry.recipient_name || '');
        setTransactionType(entry.transaction_type || 'service');
        setStartTime(entry.start_time || '10:00');
        setEndTime(entry.end_time || '11:00');
      }
      setLoading(false);
    };

    fetchEntry();
  }, [id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!service) {
      toast({
        title: 'Ошибка',
        description: 'Выберите услугу',
        variant: 'destructive',
      });
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную стоимость',
        variant: 'destructive',
      });
      return;
    }

    if (transactionType === 'service' && !paymentMethod) {
      toast({
        title: 'Ошибка',
        description: 'Выберите способ оплаты',
        variant: 'destructive',
      });
      return;
    }

    if (transactionType === 'service' && parseFloat(tips) > 0 && !tipsPaymentMethod) {
      toast({
        title: 'Ошибка',
        description: 'Выберите способ оплаты чаевых',
        variant: 'destructive',
      });
      return;
    }

    if (recipientRole === 'master' && !recipientName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите имя мастера',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const entryData = {
      service,
      price: parseFloat(price),
      tips: parseFloat(tips) || 0,
      payment_method: transactionType === 'service'
        ? (paymentMethod as 'cash' | 'card')
        : (transactionType === 'debt_salon_to_master' ? 'card' : 'cash'),
      transaction_type: transactionType,
      tips_payment_method: tipsPaymentMethod,
      client_name: clientName,
      date: format(selectedDate, 'yyyy-MM-dd'),
      recipient_role: recipientRole,
      recipient_name: recipientRole === 'master' ? recipientName : null,
      start_time: startTime,
      end_time: endTime,
    };

    let result;

    if (id) {
      result = await updateEntry(id, entryData);
    } else {
      result = await addEntry(entryData);
    }

    const { error } = result;

    if (error) {
      toast({
        title: 'Ошибка',
        description: id ? 'Не удалось обновить запись' : 'Не удалось добавить запись',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Успешно!',
        description: id ? 'Запись обновлена' : 'Запись добавлена',
      });
      // Navigate to the date of the entry
      navigate(`/dashboard?from=${format(selectedDate, 'yyyy-MM-dd')}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {id ? 'Редактировать' : 'Новая запись'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full h-12 w-12 hover:bg-secondary/80"
        >
          <X size={28} className="text-muted-foreground" />
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="px-5 space-y-3 animate-slide-up">
        {/* Transaction Type Toggle */}
        <div className="grid grid-cols-2 p-1 bg-secondary rounded-xl mb-2">
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
            Доп. оплата
          </button>
        </div>

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
              className="input-beauty h-12"
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

              {searchClientQuery && filteredClients.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 focus-within:ring-2">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setClientName(client.name);
                        setSearchClientQuery('');
                        toast({
                          title: 'Клиент выбран',
                          description: client.name,
                        });
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <User size={16} />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-bold">{client.name}</span>
                          <span className="text-[10px] text-muted-foreground">{client.phone}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {clientName && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-2xl border border-primary/10 animate-in zoom-in-95 duration-200">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <User size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold leading-tight uppercase tracking-tighter text-primary/60">Выбран клиент</p>
                    <p className="text-base font-black text-primary leading-tight">{clientName}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 text-primary"
                    onClick={() => {
                      setClientName('');
                      setSearchClientQuery('');
                    }}
                  >
                    <X size={18} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Start and End Time - Only for service transactions */}
        {transactionType === 'service' && (
          <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="startTime" className="text-sm font-medium">Начало</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-beauty h-12"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="endTime" className="text-sm font-medium">Окончание</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-beauty h-12"
              />
            </div>
          </div>
        )}
        {/* Service Selection or Description */}
        <div className="space-y-2 animate-fade-in">
          <Label className="text-sm font-medium">{transactionType === 'service' ? 'Услуга' : 'Описание (за что)'}</Label>
          {transactionType === 'service' ? (
            <ServiceChips
              selected={service}
              onChange={setService}
            />
          ) : (
            <Input
              placeholder="Например: Ресницы для админа"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="input-beauty h-12"
            />
          )}
        </div>

        {/* Price & Payment/Direction */}
        <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="w-[30%] space-y-1.5">
            <Label htmlFor="price" className="text-sm font-medium">
              {transactionType === 'service' ? 'Стоимость' : 'Сумма'}
            </Label>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-beauty h-12 text-base"
              required
            />
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            <Label className="text-sm font-medium">
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
          <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="w-[30%] space-y-1.5">
              <Label htmlFor="tips" className="text-sm font-medium">
                Чаевые
              </Label>
              <Input
                id="tips"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                className="input-beauty h-12 text-base"
              />
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              <Label className="text-sm font-medium">Оплата чаевых</Label>
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
        {/* Recipient Selection - Hide for Admin */}
        {!isAdmin && transactionType === 'service' && (
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <Label className="text-sm font-medium">Кто принял оплату?</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecipientRole('me')}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${recipientRole === 'me'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                Я
              </button>
              <button
                type="button"
                onClick={() => setRecipientRole('master')}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${recipientRole === 'master'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                Мастер
              </button>
              <button
                type="button"
                onClick={() => setRecipientRole('admin')}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${recipientRole === 'admin'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                Админ
              </button>
            </div>

            {recipientRole === 'master' && (
              <div className="pt-1 animate-fade-in">
                <Input
                  placeholder="Имя мастера"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="input-beauty h-10"
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button
            type="submit"
            className="w-full h-12 btn-primary-gradient rounded-xl text-base"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Сохранить запись'
            )}
          </Button>
        </div>
      </form>


    </div>
  );
}
