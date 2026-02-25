import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Check, Loader2 } from 'lucide-react';
import { useServices } from '@/hooks/useServices';

interface ServiceChipsProps {
  selected: string;
  onChange: (service: string) => void;
  userId?: string;
}

export function ServiceChips({ selected, onChange, userId }: ServiceChipsProps) {
  const { services, categories, loading } = useServices(userId);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].name);
    }
  }, [categories, activeTab]);

  const selectedServices = selected ? selected.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Helper to generate a unique label if service names are duplicated across categories
  const getServiceLabel = (service: any) => {
    const isDuplicate = services.some(s => s.name === service.name && s.id !== service.id);
    return isDuplicate ? `${service.name} (${service.category || 'Без категории'})` : service.name;
  };

  const toggleService = (name: string) => {
    if (selectedServices.includes(name)) {
      const newSelected = selectedServices.filter(s => s !== name);
      onChange(newSelected.join(', '));
    } else {
      const newSelected = [...selectedServices, name];
      onChange(newSelected.join(', '));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-card/30 rounded-2xl border border-dashed border-border/50">
        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8 bg-card/30 rounded-2xl border border-dashed border-border/50">
        <p className="text-xs text-muted-foreground">Услуги не найдены.</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Добавьте их в разделе «Услуги».</p>
      </div>
    );
  }

  const categoryNames = categories.length > 0
    ? categories.map(c => c.name)
    : Array.from(new Set(services.map(s => s.category || 'Без категории')));

  const displayTab = activeTab || categoryNames[0];

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

      <Tabs value={displayTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap rounded-lg mb-3">
          <TabsList className="inline-flex w-auto bg-transparent p-0 gap-2">
            {categoryNames.map(category => (
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
          <ScrollArea className="h-auto max-h-[280px] min-h-[100px] w-full">
            {categoryNames.map(category => (
              <TabsContent key={category} value={category} className="mt-0 p-1">
                <div className="flex flex-col gap-1">
                  {services
                    .filter(s => (s.category || 'Без категории') === category)
                    .map((service) => {
                      const label = getServiceLabel(service);
                      const isSelected = selectedServices.includes(label);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(label)}
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
                              {service.duration && (
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {service.duration} мин
                                </span>
                              )}
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
