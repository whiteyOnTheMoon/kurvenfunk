'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from './app-shell';

export function RouteShell({ children, apiUrl }: { children: ReactNode; apiUrl: string }) {
  const pathname = usePathname();

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return children;
  }

  return <AppShell apiUrl={apiUrl}>{children}</AppShell>;
}
