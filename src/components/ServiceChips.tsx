import { cn } from '@/lib/utils';

interface ServiceChipsProps {
  selected: string;
  onChange: (service: string) => void;
  allowMultiple?: boolean;
}

const services = [
  { id: 'manicure', label: 'Маникюр' },
  { id: 'pedicure', label: 'Педикюр' },
  { id: 'other', label: 'Другое' },
];

export function ServiceChips({ selected, onChange, allowMultiple = false }: ServiceChipsProps) {
  const selectedServices = selected ? selected.split(',') : [];

  const toggleService = (id: string) => {
    if (allowMultiple) {
      if (selectedServices.includes(id)) {
        // Remove
        const newSelected = selectedServices.filter(s => s !== id);
        onChange(newSelected.join(','));
      } else {
        // Add
        const newSelected = [...selectedServices, id];
        onChange(newSelected.join(','));
      }
    } else {
      // Single selection
      onChange(id);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {services.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => toggleService(service.id)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
            selectedServices.includes(service.id)
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-background text-foreground border-border hover:bg-secondary hover:border-secondary-foreground/20'
          )}
        >
          {service.label}
        </button>
      ))}
    </div>
  );
}
