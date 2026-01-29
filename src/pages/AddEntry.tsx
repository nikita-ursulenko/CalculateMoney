import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<Date>(
    dateParam ? parse(dateParam, 'yyyy-MM-dd', new Date()) : new Date()
  );

  const navigate = useNavigate();
  const { addEntry, updateEntry } = useEntries();
  const { toast } = useToast();

  const [service, setService] = useState('manicure');
  const [price, setPrice] = useState('');
  const [tips, setTips] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [tipsPaymentMethod, setTipsPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);

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
        setTipsPaymentMethod((entry.tips_payment_method as 'cash' | 'card') || 'cash');
        setClientName(entry.client_name || '');
        setSelectedDate(new Date(entry.date));
      }
      setLoading(false);
    };

    fetchEntry();
  }, [id, navigate, toast]);

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

    const entryData = {
      service,
      price: parseFloat(price),
      tips: parseFloat(tips) || 0,
      payment_method: paymentMethod,
      tips_payment_method: tipsPaymentMethod,
      client_name: clientName,
      date: format(selectedDate, 'yyyy-MM-dd'),
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
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="rounded-xl h-10 w-10"
        >
          <ArrowLeft size={20} />
        </Button>
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
        {/* Service Selection */}
        <div className="space-y-2 animate-fade-in">
          <Label className="text-sm font-medium">Услуга</Label>
          <ServiceChips selected={service} onChange={setService} />
        </div>

        {/* Price */}
        <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Label htmlFor="price" className="text-sm font-medium">
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
            className="input-beauty h-12 text-base"
            required
          />
        </div>

        {/* Tips */}
        <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between">
            <Label htmlFor="tips" className="text-sm font-medium">
              Чаевые (€) <span className="text-muted-foreground font-normal">— опционально</span>
            </Label>
            {/* Always show toggle or show if input has value? User wants it visible. */}
            <div className="flex bg-muted p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setTipsPaymentMethod('cash')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${tipsPaymentMethod === 'cash'
                  ? 'bg-background shadow text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Наличные
              </button>
              <button
                type="button"
                onClick={() => setTipsPaymentMethod('card')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${tipsPaymentMethod === 'card'
                  ? 'bg-background shadow text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Карта
              </button>
            </div>
          </div>
          <Input
            id="tips"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={tips}
            onChange={(e) => {
              setTips(e.target.value);
              // Default to main payment method if tips entered
              if (e.target.value && !tips) {
                setTipsPaymentMethod(paymentMethod);
              }
            }}
            className="input-beauty h-12 text-base"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Label className="text-sm font-medium">Метод оплаты</Label>
          <PaymentTabs selected={paymentMethod} onChange={setPaymentMethod} />
        </div>

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

      <BottomNav />
    </div>
  );
}
