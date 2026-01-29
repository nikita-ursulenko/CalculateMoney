import { Banknote, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentTabsProps {
  selected: 'cash' | 'card';
  onChange: (method: 'cash' | 'card') => void;
}

export function PaymentTabs({ selected, onChange }: PaymentTabsProps) {
  return (
    <div className="flex gap-2 p-1 bg-secondary rounded-xl">
      <button
        type="button"
        onClick={() => onChange('cash')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200',
          selected === 'cash'
            ? 'bg-card shadow-md text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Banknote size={20} />
        <span>Наличные</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('card')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200',
          selected === 'card'
            ? 'bg-card shadow-md text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <CreditCard size={20} />
        <span>Карта</span>
      </button>
    </div>
  );
}
