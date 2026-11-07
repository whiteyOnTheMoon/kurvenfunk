'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

import { useAuth } from '../auth/auth-provider';
import { canAccessAdminPath, getAdminNavigation } from './admin-access';
import { getPostLoginDestination } from '../auth/post-login-destination';

import styles from './admin-layout.module.css';

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { initialized, authenticated, sessionRecovering, user } = useAuth();
  const allowed = initialized && authenticated && canAccessAdminPath(user, pathname);
  const navigation = getAdminNavigation(user);

  useEffect(() => {
    // A transient identity-service error is NOT a logout. Keep the
    // protected workspace hidden until the session can be revalidated.
    if (!initialized || sessionRecovering || (authenticated && !user)) return;

    if (!authenticated) {
      router.replace('/login');
    } else if (user && !canAccessAdminPath(user, pathname)) {
      router.replace(getPostLoginDestination(user));
    }
  }, [initialized, authenticated, sessionRecovering, user, pathname, router]);

  // Keep the entire admin navigation and page subtree out of the DOM until
  // the verified backend identity has appropriate privileges.
  if (!allowed) {
    return <p role="status">Zugriff auf die Verwaltung wird geprüft …</p>;
  }

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
          {navigation.map((item) => {
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
