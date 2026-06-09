import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Timer, Users, User, Zap, Flame, LogOut, BarChart3, Sparkles, Target,
  PanelLeftClose, PanelLeftOpen, FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/lib/database';
import { cn } from '@/lib/utils';
import logo from '@/assets/learnflow-logo.png';
import { useSidebarState } from '@/contexts/SidebarContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Primary navigation. Nested routes (memory, plan, leaderboard, portfolio, mentor)
// are reached from inside their parent sections.
export const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/study',     icon: Timer,           label: 'Study' },
  { to: '/goals',     icon: Target,          label: 'Goals' },
  { to: '/report',    icon: FileText,        label: 'Daily Reports' },
  { to: '/analytics', icon: BarChart3,       label: 'Analysis' },
  { to: '/community', icon: Users,           label: 'Community' },
  { to: '/ai',        icon: Sparkles,        label: 'AI Assistant' },
  { to: '/profile',   icon: User,            label: 'Profile' },
];

interface AppSidebarProps {
  variant?: 'fixed' | 'inline';
  onNavigate?: () => void;
}

export default function AppSidebar({ variant = 'fixed', onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { collapsed, toggle } = useSidebarState();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => user ? getProfile(user.id) : null,
    enabled: !!user,
  });

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User';
  const level = profile?.level || 'Beginner';
  const xp = profile?.xp || 0;
  const streak = profile?.streak || 0;
  const logoHref = user ? '/dashboard' : '/';

  // On mobile drawer (inline), always render expanded
  const isCollapsed = variant === 'fixed' && collapsed;

  const isItemActive = (to: string) => {
    if (to === '/ai') return location.pathname.startsWith('/ai');
    if (to === '/study') return location.pathname === '/study' || location.pathname.startsWith('/study/') || location.pathname === '/memory' || location.pathname === '/plan' || location.pathname === '/report';
    if (to === '/analytics') return location.pathname === '/analytics' || location.pathname === '/leaderboard';
    if (to === '/profile') return location.pathname === '/profile' || location.pathname === '/portfolio' || location.pathname === '/mentor';
    if (to === '/goals') return location.pathname === '/goals' || location.pathname.startsWith('/goal/');
    return location.pathname === to;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'flex h-dvh flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300',
          isCollapsed ? 'w-[72px]' : 'w-64',
          variant === 'fixed' && 'fixed left-0 top-0 z-40 hidden lg:flex'
        )}
      >
        {/* Header */}
        <div className={cn('flex items-center gap-2 px-3 py-4', isCollapsed ? 'justify-center' : 'justify-between')}>
          <Link
            to={logoHref}
            onClick={onNavigate}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img src={logo} alt="LearnFlow" className="h-9 w-9 shrink-0 object-contain" />
            {!isCollapsed && <span className="font-display text-lg font-bold text-foreground">learnflow</span>}
          </Link>
          {!isCollapsed && variant === 'fixed' && (
            <button
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {variant === 'fixed' && isCollapsed && (
          <div className="px-2 pb-2">
            <button
              onClick={toggle}
              aria-label="Expand sidebar"
              className="flex w-full items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* User card */}
        {!isCollapsed && (
          <div className="mx-3 mb-3 rounded-lg border border-border/50 bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{level}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-xp"><Zap className="h-3.5 w-3.5" /> {xp.toLocaleString()} XP</span>
              <span className="flex items-center gap-1 text-streak"><Flame className="h-3.5 w-3.5" /> {streak} days</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className={cn('flex-1 space-y-0.5 overflow-y-auto', isCollapsed ? 'px-2' : 'px-3')}>
          {navItems.map((item) => {
            const active = isItemActive(item.to);
            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-label={item.label}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                  active ? 'bg-primary/10 text-primary shadow-glow-primary' : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="shrink-0" style={{ width: 18, height: 18 }} />
                {!isCollapsed && item.label}
              </NavLink>
            );
            if (isCollapsed) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>

        {/* Bottom */}
        <div className={cn('border-t border-sidebar-border', isCollapsed ? 'p-2' : 'p-4')}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { onNavigate?.(); signOut(); }}
                  className="flex min-h-11 w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <button
                onClick={() => { onNavigate?.(); signOut(); }}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">LearnFlow • Build Consistency. Master Skills.</p>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
