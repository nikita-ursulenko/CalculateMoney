import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, ArrowLeft, Euro, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ServiceChips } from '@/components/ServiceChips';
import { PaymentTabs } from '@/components/PaymentTabs';
import { BottomNav } from '@/components/BottomNav';
import { useAdminEntries } from '@/hooks/useAdminEntries';
import { useMasters } from '@/hooks/useMasters';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminAddEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { masters } = useMasters();

  // Get master and date from URL
  const masterId = searchParams.get('master');
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam ? parseISO(dateParam) : new Date();
  const selectedMaster = masters.find(m => m.user_id === masterId);

  const { addEntry, loading } = useAdminEntries(masterId, selectedDate);

  const [service, setService] = useState('');
  const [price, setPrice] = useState('');
  const [tips, setTips] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [tipsPaymentMethod, setTipsPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [clientName, setClientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState<'service' | 'debt_salon_to_master' | 'debt_master_to_salon'>('service');

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
        // Redundant check but keeps logic clear
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

    setSubmitting(true);

    const { error } = await addEntry(
      {
        service,
        price: Number(price),
        tips: Number(tips) || 0,
        payment_method: transactionType === 'service'
          ? (paymentMethod as 'cash' | 'card')
          : (transactionType === 'debt_salon_to_master' ? 'card' : 'cash'),
        transaction_type: transactionType,
        tips_payment_method: tipsPaymentMethod,
        client_name: clientName,
        date: format(selectedDate, 'yyyy-MM-dd'),
      },
      masterId
    );

    setSubmitting(false);

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить запись',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Готово',
        description: 'Запись добавлена',
      });
      navigate(`/admin?master=${masterId}&from=${format(selectedDate, 'yyyy-MM-dd')}`);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin?master=${masterId}`)}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Новая запись</h1>
            <p className="text-xs text-muted-foreground">
              {selectedMaster?.master_name} • {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
          <div className="w-10" />
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

        {/* Client Name */}
        <div className="space-y-2">
          <Label htmlFor="client" className="text-sm font-medium text-foreground">
            Имя клиента
          </Label>
          <Input
            id="client"
            type="text"
            placeholder="Опционально"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Service Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {transactionType === 'service' ? 'Услуга' : 'Описание (за что)'}
          </Label>
          {transactionType === 'service' ? (
            <ServiceChips selected={service} onChange={setService} />
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
            'Добавить запись'
          )}
        </Button>
      </div>

      <BottomNav isAdmin />
    </div>
  );
}
