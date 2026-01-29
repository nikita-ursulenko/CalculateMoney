import { Home, Plus, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onAddClick?: () => void;
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Главная' },
    { path: '/add', icon: Plus, label: 'Добавить', isFab: true },
    { path: '/settings', icon: Settings, label: 'Настройки' },
  ];

  return (
    <nav className="bottom-nav safe-area-bottom">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        if (item.isFab) {
          return (
            <button
              key={item.path}
              onClick={() => onAddClick ? onAddClick() : navigate(item.path)}
              className="fab-button text-primary-foreground -mt-8 transition-transform hover:scale-105 active:scale-95"
            >
              <Icon size={24} />
            </button>
          );
        }

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn('nav-item', isActive && 'nav-item-active')}
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
