import { Home, Plus, Settings, X, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onAddClick?: () => void;
  isAdmin?: boolean;
}

export function BottomNav({ onAddClick, isAdmin = false }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = isAdmin ? '/admin' : '/dashboard';
  const settingsPath = isAdmin ? '/admin' : '/settings';

  const navItems = isAdmin
    ? [
      { path: '/admin', icon: Shield, label: 'Админка' },
      { path: '/admin/add', icon: Plus, label: 'Добавить', isFab: true },
      { path: '/dashboard', icon: Home, label: 'Мастер' },
    ]
    : [
      { path: '/dashboard', icon: Home, label: 'Главная' },
      { path: '/add', icon: Plus, label: 'Добавить', isFab: true },
      { path: '/settings', icon: Settings, label: 'Настройки' },
    ];

  return (
    <nav className="bottom-nav safe-area-bottom">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path === '/admin' && location.pathname.startsWith('/admin'));
        const Icon = item.icon;

        if (item.isFab) {
          const isAddOrEdit = location.pathname.includes('/add') || location.pathname.includes('/edit');
          const FinalIcon = isAddOrEdit ? X : Icon;

          return (
            <button
              key={item.path}
              onClick={() => {
                if (isAddOrEdit) {
                  navigate(basePath);
                } else if (onAddClick) {
                  onAddClick();
                } else {
                  navigate(item.path);
                }
              }}
              className={cn(
                "fab-button text-primary-foreground -mt-8 transition-all duration-300 hover:scale-105 active:scale-95",
                isAddOrEdit && "!bg-none !bg-destructive hover:!bg-destructive/90 rotate-90"
              )}
            >
              <FinalIcon size={24} />
            </button>
          );
        }

        return (
          <button
            key={item.path}
            onClick={() => {
              const direction = item.path === '/settings' || item.path === '/dashboard' ? 'forward' : 'back';
              navigate(item.path, { state: { direction } });
            }}
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
