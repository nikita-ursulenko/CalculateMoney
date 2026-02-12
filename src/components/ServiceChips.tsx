import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Check } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

const SERVICES: Service[] = [
  { id: '1', name: 'Маникюр с покрытием', price: 50, duration: 90, category: 'Ногти' },
  { id: '2', name: 'Педикюр без покрытия', price: 40, duration: 60, category: 'Ногти' },
  { id: '5', name: 'Снятие гель-лака', price: 10, duration: 20, category: 'Ногти' },
  { id: '6', name: 'Укрепление гелем', price: 15, duration: 30, category: 'Ногти' },
  { id: '7', name: 'Ремонт ногтя', price: 5, duration: 15, category: 'Ногти' },
  { id: '8', name: 'Дизайн (1 палец)', price: 2, duration: 10, category: 'Ногти' },
  { id: '9', name: 'Френч', price: 10, duration: 30, category: 'Ногти' },
  { id: '10', name: 'Градиент', price: 15, duration: 40, category: 'Ногти' },
  { id: '11', name: 'Матовый топ', price: 5, duration: 5, category: 'Ногти' },
  { id: '12', name: 'Парафинотерапия', price: 15, duration: 20, category: 'Ногти' },
  { id: '3', name: 'Наращивание ресниц 2D', price: 65, duration: 120, category: 'Ресницы' },
  { id: '13', name: 'Наращивание ресниц 3D', price: 75, duration: 150, category: 'Ресницы' },
  { id: '14', name: 'Классика', price: 55, duration: 90, category: 'Ресницы' },
  { id: '4', name: 'Коррекция бровей', price: 15, duration: 30, category: 'Брови' },
  { id: '15', name: 'Окрашивание бровей', price: 15, duration: 20, category: 'Брови' },
  { id: '16', name: 'Ламинирование бровей', price: 40, duration: 60, category: 'Брови' },
];

const CATEGORIES = ['Ногти', 'Ресницы', 'Брови', 'Уход'];

interface ServiceChipsProps {
  selected: string;
  onChange: (service: string) => void;
}

export function ServiceChips({ selected, onChange }: ServiceChipsProps) {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0]);
  const selectedServices = selected ? selected.split(',').map(s => s.trim()).filter(Boolean) : [];

  const toggleService = (name: string) => {
    if (selectedServices.includes(name)) {
      const newSelected = selectedServices.filter(s => s !== name);
      onChange(newSelected.join(', '));
    } else {
      const newSelected = [...selectedServices, name];
      onChange(newSelected.join(', '));
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected Services Counter/Summary */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Выбрано: {selectedServices.length}
        </span>
        {selectedServices.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] font-bold text-primary hover:text-primary/70 transition-colors uppercase tracking-widest"
          >
            Очистить
          </button>
        )}
      </div>

      <Tabs defaultValue={CATEGORIES[0]} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap rounded-lg mb-3">
          <TabsList className="inline-flex w-auto bg-transparent p-0 gap-2">
            {CATEGORIES.map(category => (
              <TabsTrigger
                key={category}
                value={category}
                className="rounded-full px-5 py-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/50 shadow-sm transition-all"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>

        <div className="bg-card/50 rounded-2xl border border-border/40 overflow-hidden">
          <ScrollArea className="h-[280px] w-full">
            {CATEGORIES.map(category => (
              <TabsContent key={category} value={category} className="mt-0 p-1">
                <div className="flex flex-col gap-1">
                  {SERVICES.filter(s => s.category === category).map((service) => {
                    const isSelected = selectedServices.includes(service.name);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.name)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border border-transparent group',
                          isSelected
                            ? 'bg-primary/10 border-primary/20'
                            : 'hover:bg-secondary/40'
                        )}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-background border-border"
                          )}>
                            {isSelected && <Check size={12} strokeWidth={4} />}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className={cn(
                              "text-sm font-bold transition-colors leading-tight",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {service.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {service.duration} мин
                            </span>
                          </div>
                        </div>
                        <div className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-black transition-all",
                          isSelected
                            ? "bg-primary text-white shadow-sm"
                            : "bg-secondary text-secondary-foreground"
                        )}>
                          {service.price}€
                        </div>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </div>
      </Tabs>

      {/* Selected Services List (Moved to bottom) */}
      {selectedServices.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 p-3 bg-primary/5 rounded-2xl border border-dashed border-primary/20 animate-fade-in">
          {selectedServices.map(name => (
            <span
              key={name}
              className="px-3 py-1 bg-background border border-primary/20 text-primary text-[10px] font-black rounded-full flex items-center gap-2 shadow-sm"
            >
              {name}
              <button
                type="button"
                onClick={() => toggleService(name)}
                className="hover:text-destructive transition-colors bg-primary/10 rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-center text-muted-foreground font-medium italic">
          Выберите одну или несколько услуг выше
        </p>
      )}
    </div>
  );
}
