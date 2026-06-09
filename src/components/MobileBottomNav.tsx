import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Timer, FileText, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/study',     icon: Timer,           label: 'Study' },
  { to: '/report',    icon: FileText,        label: 'Reports' },
  { to: '/analytics', icon: BarChart3,       label: 'Analysis' },
  { to: '/community', icon: Users,           label: 'Community' },
];

export default function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border/60 bg-background/90 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          aria-label={tab.label}
          className={({ isActive }) =>
            cn(
              'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <tab.icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
