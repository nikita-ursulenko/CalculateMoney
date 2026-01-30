import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, ArrowLeft } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [tipsPaymentMethod, setTipsPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [clientName, setClientName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!service || !price || !masterId) {
      toast({
        title: 'Заполните поля',
        description: 'Услуга и стоимость обязательны',
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
        payment_method: paymentMethod,
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

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-medium text-foreground">
            Стоимость (€)
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

        {/* Tips */}
        <div className="space-y-2">
          <Label htmlFor="tips" className="text-sm font-medium text-foreground">
            Чаевые (€)
          </Label>
          <Input
            id="tips"
            type="number"
            placeholder="0"
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            className="text-lg h-12"
          />
          {Number(tips) > 0 && (
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground mb-2 block">Чаевые получены:</Label>
              <PaymentTabs selected={tipsPaymentMethod} onChange={setTipsPaymentMethod} />
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Способ оплаты</Label>
          <PaymentTabs selected={paymentMethod} onChange={setPaymentMethod} />
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
