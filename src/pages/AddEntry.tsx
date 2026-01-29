import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BottomNav } from '@/components/BottomNav';
import { ServiceChips } from '@/components/ServiceChips';
import { PaymentTabs } from '@/components/PaymentTabs';
import { useEntries } from '@/hooks/useEntries';
import { useToast } from '@/hooks/use-toast';

export default function AddEntry() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam 
    ? parse(dateParam, 'yyyy-MM-dd', new Date()) 
    : new Date();
  const navigate = useNavigate();
  const { addEntry } = useEntries();
  const { toast } = useToast();
  
  const [service, setService] = useState('manicure');
  const [price, setPrice] = useState('');
  const [tips, setTips] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!price || parseFloat(price) <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную стоимость',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await addEntry({
      service,
      price: parseFloat(price),
      tips: parseFloat(tips) || 0,
      payment_method: paymentMethod,
      client_name: clientName,
      date: format(selectedDate, 'yyyy-MM-dd'),
    });

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить запись',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Успешно!',
        description: 'Запись добавлена',
      });
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="px-5 pt-8 pb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="rounded-xl"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Новая запись
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-5 space-y-6">
        {/* Service Selection */}
        <div className="space-y-3 animate-fade-in">
          <Label className="text-base font-medium">Услуга</Label>
          <ServiceChips selected={service} onChange={setService} />
        </div>

        {/* Price */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Label htmlFor="price" className="text-base font-medium">
            Стоимость (€)
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
            className="input-beauty h-14 text-lg"
            required
          />
        </div>

        {/* Tips */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <Label htmlFor="tips" className="text-base font-medium">
            Чаевые (€) <span className="text-muted-foreground font-normal">— опционально</span>
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
            className="input-beauty h-14 text-lg"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Label className="text-base font-medium">Метод оплаты</Label>
          <PaymentTabs selected={paymentMethod} onChange={setPaymentMethod} />
        </div>

        {/* Client Name */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <Label htmlFor="clientName" className="text-base font-medium">
            Имя клиента
          </Label>
          <Input
            id="clientName"
            type="text"
            placeholder="Введите имя"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="input-beauty h-14"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button
            type="submit"
            className="w-full h-14 btn-primary-gradient rounded-xl text-lg"
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

      <BottomNav />
    </div>
  );
}
