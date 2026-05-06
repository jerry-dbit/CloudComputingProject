'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/rooms', label: 'Study Rooms', icon: Users },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();

  if (pathname === '/') {
    return null;
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[var(--surface)] border-r border-[var(--surface-dark)] flex flex-col z-40">
      <div className="p-6 border-b border-[var(--surface-dark)]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[var(--primary)]">StudyFlow</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-dark)] hover:text-[var(--text-primary)]'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--surface-dark)] space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-dark)] hover:text-[var(--text-primary)] transition-all duration-200 w-full"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-dark)] hover:text-[var(--text-primary)] transition-all duration-200"
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
        
        <button
          onClick={() => void logout()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-dark)] hover:text-[var(--text-primary)] transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>

      <div className="p-4 border-t border-[var(--surface-dark)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar src={user?.avatar} fallback={(user?.username || 'User').slice(0, 2)} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">
              {loading ? 'Loading...' : user?.username || 'Unknown user'}
            </p>
            <p className="text-sm text-[var(--text-secondary)] truncate">{user?.email || 'No email'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
