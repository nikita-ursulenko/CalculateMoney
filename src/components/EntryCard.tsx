import { Trash2, CreditCard, Banknote } from 'lucide-react';
import { Entry } from '@/hooks/useEntries';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface EntryCardProps {
  entry: Entry;
  rateCash: number;
  rateCard: number;
  onDelete: (id: string) => void;
  showTips?: boolean;
  onClick?: () => void;
}

export function EntryCard({ entry, rateCash, rateCard, onDelete, showTips = true, onClick }: EntryCardProps) {
  const isCash = entry.payment_method === 'cash';
  const rate = isCash ? rateCash : rateCard;

  // Расчет баланса по логике
  // Calculate Service Balance
  let balance = isCash
    ? -(entry.price * (1 - rate / 100)) // Master owes Salon
    : entry.price * (rate / 100); // Salon owes Master

  // Calculate Tips Balance
  // If tips are cash, Master keeps 100% (no impact on balance with salon)
  // If tips are card, Salon receives them, so Salon owes Master (rateCard applied)
  if (entry.tips > 0 && entry.tips_payment_method === 'card') {
    balance += entry.tips * (rateCard / 100);
  }

  const balanceAmount = balance;

  const serviceLabels: Record<string, string> = {
    manicure: 'Маникюр',
    pedicure: 'Педикюр',
    other: 'Другое',
  };

  return (
    <div className="entry-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-2 mb-2">
            <span className="service-chip service-chip-active text-xs py-1 px-3">
              {serviceLabels[entry.service] || entry.service}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground">
              {isCash ? (
                <Banknote size={16} className="text-success" />
              ) : (
                <CreditCard size={16} className="text-primary" />
              )}
              <span className="text-xs">{isCash ? 'Наличные' : 'Карта'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mr-2 mt-1">
            <p className="font-medium text-foreground text-sm">
              {entry.client_name || 'Без имени'}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">€{Number(entry.price).toFixed(2)}</span>
              {(showTips || entry.tips_payment_method === 'card') && entry.tips > 0 && (
                <div className="flex items-center gap-1 text-success text-xs">
                  <span>+€{Number(entry.tips).toFixed(2)}</span>
                  {entry.tips_payment_method === 'card' ? <CreditCard size={12} className="text-primary" /> : <Banknote size={12} className="text-success" />}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`text-sm font-bold ${balanceAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
            {balanceAmount >= 0 ? '+' : ''}€{balanceAmount.toFixed(2)}
          </span>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Запись будет удалена навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
