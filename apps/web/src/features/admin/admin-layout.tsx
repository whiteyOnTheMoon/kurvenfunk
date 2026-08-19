'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import styles from './admin-layout.module.css';

const adminNavigation = [
  { href: '/admin', label: 'Dashboard', shortLabel: 'DB' },
  { href: '/admin/artikel', label: 'Artikel', shortLabel: 'AR' },
  { href: '/admin/kategorien', label: 'Kategorien', shortLabel: 'KA' },
  { href: '/admin/tags', label: 'Tags', shortLabel: 'TA' },
  { href: '/admin/medien', label: 'Medien', shortLabel: 'ME' },
  { href: '/admin/importe', label: 'Importe', shortLabel: 'IM' },
  { href: '/admin/sportdaten', label: 'Sportdaten', shortLabel: 'SP' },
  { href: '/admin/benutzer', label: 'Benutzer', shortLabel: 'BE' },
  { href: '/admin/moderation', label: 'Moderation', shortLabel: 'MO' },
  { href: '/admin/forum', label: 'Forum', shortLabel: 'FO' },
  { href: '/admin/system', label: 'System', shortLabel: 'SY' },
] as const;

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.adminBrand}>
            <span className={styles.brandMark} aria-hidden="true">
              KF
            </span>

            <span>
              <strong>Kurvenfunk</strong>
              <small>Administration</small>
            </span>
          </Link>
        </div>

        <nav className={styles.navigation} aria-label="Admin Navigation">
          {adminNavigation.map((item) => {
            const current = isCurrentPath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navigationItem}
                aria-current={current ? 'page' : undefined}
              >
                <span className={styles.navigationIcon} aria-hidden="true">
                  {item.shortLabel}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backLink}>
            <span aria-hidden="true">←</span>
            Zurück zum Portal
          </Link>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.environmentLabel}>Administration</span>
          </div>

          <div className={styles.topbarActions}>
            <Link href="/" className={styles.portalLink}>
              Portal öffnen
            </Link>

            <div className={styles.adminAvatar} aria-hidden="true">
              KF
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>
    </div>
  );
}
