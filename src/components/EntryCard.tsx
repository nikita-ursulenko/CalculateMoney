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
      <div className="flex flex-col gap-2 relative">
        <div className="flex-1 cursor-pointer" onClick={onClick}>

          {/* Top Row: Service + Icons */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <span className="service-chip service-chip-active text-[10px] py-0.5 px-2">
                {serviceLabels[entry.service] || entry.service}
              </span>
              {entry.recipient_role && entry.recipient_role !== 'me' && (
                <div className="text-yellow-500 animate-pulse" title={entry.recipient_role === 'admin' ? 'Админ' : entry.recipient_name}>
                  <TriangleAlert size={18} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70">{isCash ? 'Нал.' : 'Крт.'}</span>
              {isCash ? (
                <Banknote size={18} className="text-success" />
              ) : (
                <CreditCard size={18} className="text-primary" />
              )}
            </div>
          </div>

          {/* Middle Row: Client + Price */}
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-foreground text-sm truncate mr-1 max-w-[80px]" title={entry.client_name}>
              {entry.client_name || 'Без имени'}
            </p>
            <div className="flex flex-col items-end">
              <span className="font-semibold text-sm">€{Number(entry.price).toFixed(0)}</span>
              {(showTips || entry.tips_payment_method === 'card') && entry.tips > 0 && (
                <div className="flex items-center gap-0.5 text-success text-xs font-medium">
                  <span>+€{Number(entry.tips).toFixed(0)}</span>
                  {entry.tips_payment_method === 'card' ? <CreditCard size={14} className="text-primary" /> : <Banknote size={14} className="text-success" />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Balance + Delete */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          {entry.recipient_role && entry.recipient_role !== 'me' ? (
            entry.recipient_role === 'admin' && isCash ? (
              <span className="text-xs font-bold text-success">
                +€{isCash ? (entry.price * (rateCard / 100)).toFixed(2) : Math.abs(balanceAmount).toFixed(2)}
              </span>
            ) : (
              <span className={`text-xs font-bold ${balanceAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                {balanceAmount >= 0 ? '+' : '-'}€{Math.abs(balanceAmount).toFixed(2)}
              </span>
            )
          ) : (
            <span className={`text-xs font-bold ${balanceAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
              {balanceAmount >= 0 ? '+' : '-'}€{Math.abs(balanceAmount).toFixed(2)}
            </span>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-1">
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
