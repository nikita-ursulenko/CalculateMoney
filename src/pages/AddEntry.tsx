import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Loader2, Euro, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BottomNav } from '@/components/BottomNav';
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
      <header className="px-5 pt-6 pb-4 flex items-center gap-4">

        <div>
          <h1 className="text-xl font-display font-bold text-foreground">
            {id ? 'Редактировать' : 'Новая запись'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-5 space-y-4 animate-slide-up">
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

        {/* Client Name */}
        <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <Label htmlFor="clientName" className="text-sm font-medium">
            Имя клиента
          </Label>
          <Input
            id="clientName"
            type="text"
            placeholder="Введите имя"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="input-beauty h-12"
          />
        </div>
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

      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
