'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = pathname !== '/';

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? 'flex-1 ml-[260px] p-8' : 'flex-1 p-8'}>
        <div className="max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
