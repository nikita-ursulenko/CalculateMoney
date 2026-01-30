import { Trash2, CreditCard, Banknote, TriangleAlert } from 'lucide-react';
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

  // Calculate Service Balance
  let balance = isCash
    ? -(entry.price * (1 - rate / 100)) // Master owes Salon
    : entry.price * (rate / 100); // Salon owes Master

  // Calculate Tips Balance
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
    <div className="entry-card animate-fade-in py-2 px-3">
      <div className="flex items-center gap-3">

        {/* Left: Info */}
        <div className="flex-1 flex items-center gap-3 cursor-pointer overflow-hidden" onClick={onClick}>
          {/* Icon */}
          <div className={`shrink-0 p-2 rounded-full ${isCash ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
            {isCash ? <Banknote size={16} /> : <CreditCard size={16} />}
          </div>

          {/* Texts */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate">
                {entry.client_name || 'Без имени'}
              </span>
              {(showTips || entry.tips_payment_method === 'card') && entry.tips > 0 && (
                <div className="flex items-center text-success text-[10px] font-bold bg-success/10 px-1 rounded">
                  +€{Number(entry.tips).toFixed(0)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md whitespace-nowrap">
                {serviceLabels[entry.service] || entry.service}
              </span>
              {entry.recipient_role && entry.recipient_role !== 'me' && (
                <TriangleAlert size={12} className="text-yellow-500 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Right: Financials & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end">
            <span className="font-bold text-sm">€{Number(entry.price).toFixed(0)}</span>

            {/* Small Balance Text */}
            {entry.recipient_role && entry.recipient_role !== 'me' ? (
              entry.recipient_role === 'admin' && isCash ? (
                <span className="text-[10px] font-bold text-success">
                  +€{isCash ? (entry.price * (rateCard / 100)).toFixed(2) : Math.abs(balanceAmount).toFixed(2)}
                </span>
              ) : (
                <span className={`text-[10px] font-bold ${balanceAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {balanceAmount >= 0 ? 'Долг: ' : 'Мне: '}
                  {balanceAmount >= 0 ? '+' : ''}€{Math.abs(balanceAmount).toFixed(2)}
                </span>
              )
            ) : (
              <span className={`text-[10px] font-bold ${balanceAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                {balanceAmount >= 0 ? 'Долг: ' : 'Мне: '}
                {balanceAmount >= 0 ? '+' : ''}€{Math.abs(balanceAmount).toFixed(2)}
              </span>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground/30 hover:text-destructive">
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                <AlertDialogDescription>
                  Запись будет удалена навсегда.
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
