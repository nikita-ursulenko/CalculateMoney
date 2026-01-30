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

  const handleSubmit = async () => {
    if (!service || !price || !masterId || !paymentMethod) {
      toast({
        title: 'Заполните поля',
        description: 'Услуга, стоимость и способ оплаты обязательны',
        variant: 'destructive',
      });
      return;
    }

    // Validate tips payment method
    if (Number(tips) > 0 && !tipsPaymentMethod) {
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
        payment_method: paymentMethod as 'cash' | 'card',
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
          <Label className="text-sm font-medium text-foreground">Услуга</Label>
          <ServiceChips selected={service} onChange={setService} />
        </div>

        {/* Price & Payment Method */}
        <div className="flex gap-3">
          <div className="w-[30%] space-y-2">
            <Label htmlFor="price" className="text-sm font-medium text-foreground">
              Стоимость
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
            <Label className="text-sm font-medium text-foreground">Оплата</Label>
            <div className="h-12">
              <PaymentTabs selected={paymentMethod} onChange={setPaymentMethod} className="h-full" />
            </div>
          </div>
        </div>

        {/* Tips */}
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



        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !service || !price}
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
