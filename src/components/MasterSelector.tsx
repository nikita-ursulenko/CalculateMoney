import { Master } from '@/hooks/useMasters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';

interface MasterSelectorProps {
  masters: Master[];
  selectedMasterId: string | null;
  onSelectMaster: (masterId: string) => void;
  loading?: boolean;
}

export function MasterSelector({
  masters,
  selectedMasterId,
  onSelectMaster,
  loading = false,
}: MasterSelectorProps) {
  const selectedMaster = masters.find(m => m.user_id === selectedMasterId);

  return (
    <Select
      value={selectedMasterId || undefined}
      onValueChange={onSelectMaster}
      disabled={loading || masters.length === 0}
    >
      <SelectTrigger className="w-full bg-card border-border h-12">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Выберите мастера">
            {selectedMaster ? (
              <span className="flex items-center gap-2">
                {selectedMaster.master_name}
                {selectedMaster.master_profession && (
                  <span className="text-xs text-muted-foreground hidden sm:inline-block">
                    ({selectedMaster.master_profession})
                  </span>
                )}
              </span>
            ) : 'Выберите мастера'}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-card border-border z-50">
        {masters.map((master) => (
          <SelectItem
            key={master.user_id}
            value={master.user_id}
            className="cursor-pointer py-3"
          >
            <div className="flex flex-col text-left">
              <span className="font-medium">{master.master_name}</span>
              {master.master_profession && (
                <span className="text-xs text-muted-foreground">
                  {master.master_profession}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
