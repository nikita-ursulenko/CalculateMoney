import { Euro, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentTabsProps {
  selected: 'cash' | 'card' | null;
  onChange: (method: 'cash' | 'card') => void;
  className?: string; // Add this
}

export function PaymentTabs({ selected, onChange, className }: PaymentTabsProps) {
  return (
    <div className={cn("flex gap-1 p-1 bg-secondary rounded-xl", className)}>
      <button
        type="button"
        onClick={() => onChange('cash')}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 px-1 rounded-lg font-medium transition-all duration-200',
          selected === 'cash'
            ? 'bg-green-500 text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Euro className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm">Наличные</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('card')}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 px-1 rounded-lg font-medium transition-all duration-200',
          selected === 'card'
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm">Карта</span>
      </button>
    </div>
  );
}
