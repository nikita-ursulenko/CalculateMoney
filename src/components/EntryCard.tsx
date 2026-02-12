import { Trash2, CreditCard, Euro, TriangleAlert, Handshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  isAdminView?: boolean;
  isOwnerView?: boolean;
}

export function EntryCard({ entry, rateCash, rateCard, onDelete, showTips = true, onClick, isAdminView = false, isOwnerView = false }: EntryCardProps) {
  const isCash = entry.payment_method === 'cash';
  const isDebt = entry.transaction_type && entry.transaction_type !== 'service';
  const rate = isCash ? rateCash : rateCard;

  // Calculate Service Balance
  let balance: number;

  if (entry.transaction_type === 'debt_salon_to_master') {
    balance = entry.price;
  } else if (entry.transaction_type === 'debt_master_to_salon') {
    balance = -entry.price;
  } else {
    balance = isCash
      ? -(entry.price * (1 - rate / 100))
      : entry.price * (rate / 100);
  }

  // Calculate Tips Balance
  if (entry.tips > 0 && entry.tips_payment_method === 'card') {
    balance += entry.tips * (rateCard / 100);
  }

  // If Admin View, invert the balance perspective
  // If Master owes Salon (-), Admin sees (+)
  // If Salon owes Master (+), Admin sees (-)
  if (isAdminView) {
    balance = -balance;
  }

  const balanceAmount = balance;

  const serviceLabels: Record<string, string> = {
    manicure: 'Маникюр',
    pedicure: 'Педикюр',
    other: 'Другое',
  };

  const displayServices = entry.service
    .split(',')
    .map(s => serviceLabels[s.trim()] || s);

  const navigate = useNavigate();

  return (
    <div className="entry-card animate-fade-in py-2 px-3">
      <div className="flex items-center gap-3">

        {/* Left: Info */}
        <div
          className="flex-1 flex items-center gap-3 cursor-pointer overflow-hidden"
          onClick={onClick || (() => navigate(`/add/${entry.id}`))}
        >
          {/* Icon */}
          <div className={`shrink-0 p-2 rounded-full ${isDebt
            ? 'bg-purple-100 text-purple-600'
            : isCash
              ? 'bg-success/10 text-success'
              : 'bg-primary/10 text-primary'
            }`}>
            {isDebt ? <Handshake size={16} /> : (isCash ? <Euro size={16} /> : <CreditCard size={16} />)}
          </div>

          {/* Texts */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate">
                {entry.client_name || 'Без имени'}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex flex-col gap-1 items-start">
                {displayServices.map((service, idx) => (
                  <span key={idx} className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md whitespace-nowrap">
                    {service}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Show tips if: 
                    1. Tips > 0
                    2. AND (
                        It's NOT Admin View (use standard showTips logic)
                        OR 
                        It IS Admin View BUT tips are Card (hide Cash tips for Admin)
                      )
                */}
                {entry.tips > 0 && (!isAdminView || entry.tips_payment_method === 'card') && (
                  <div className="flex items-center text-success text-[10px] font-bold bg-success/10 px-1 rounded">
                    +€{Number(entry.tips).toFixed(0)}
                  </div>
                )}
                {entry.recipient_role && entry.recipient_role !== 'me' && (
                  <TriangleAlert size={12} className="text-yellow-500 shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Financials & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end">
            <span className="font-bold text-sm">€{Number(entry.price).toFixed(0)}</span>

            {/* Small Balance Text */}
            {!isOwnerView && (
              entry.recipient_role && entry.recipient_role !== 'me' ? (
                entry.recipient_role === 'admin' && isCash ? (
                  // Admin took cash -> Effectively card for master. Admin owes master commission.
                  // For Admin View? Admin has cash. Admin owes master (price * rate).
                  // But let's keep simplistic logic first.
                  <span className="text-[10px] font-bold text-success">
                    +€{isCash ? (entry.price * (rateCard / 100)).toFixed(2) : Math.abs(balanceAmount).toFixed(2)}
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold ${balanceAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {balanceAmount >= 0 ? '+' : '-'}€{Math.abs(balanceAmount).toFixed(2)}
                  </span>
                )
              ) : (
                <span className={`text-[10px] font-bold ${balanceAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {balanceAmount >= 0 ? '+' : '-'}€{Math.abs(balanceAmount).toFixed(2)}
                </span>
              )
            )}
            {isOwnerView && (
              <span className="text-[10px] font-bold text-muted-foreground/0 select-none">&nbsp;</span>
              // Or simply nothing. If nothing, layout might shift. But flex-col items-end handles it.
              // Let's render nothing.
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
