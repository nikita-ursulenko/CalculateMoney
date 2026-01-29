import { cn } from '@/lib/utils';

interface ServiceChipsProps {
  selected: string;
  onChange: (service: string) => void;
}

const services = [
  { id: 'manicure', label: 'Маникюр' },
  { id: 'pedicure', label: 'Педикюр' },
  { id: 'removal', label: 'Снятие' },
  { id: 'design', label: 'Дизайн' },
  { id: 'other', label: 'Другое' },
];

export function ServiceChips({ selected, onChange }: ServiceChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {services.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => onChange(service.id)}
          className={cn(
            'service-chip',
            selected === service.id ? 'service-chip-active' : 'service-chip-inactive'
          )}
        >
          {service.label}
        </button>
      ))}
    </div>
  );
}
