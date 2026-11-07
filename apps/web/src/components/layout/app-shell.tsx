'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../features/auth/auth-provider';
import { getAdminMenuDestination } from '../../features/admin/admin-access';
import styles from './app-shell.module.css';

const navigationItems = [
  { href: '/', label: 'Start' },
  { href: '/news', label: 'News' },
  { href: '/spiele', label: 'Spiele' },
  { href: '/tabelle', label: 'Tabelle' },
  { href: '/forum', label: 'Forum' },
];

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function Navigation({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      className={mobile ? styles.mobileNavigation : styles.desktopNavigation}
      aria-label={mobile ? 'Mobile Navigation' : 'Hauptnavigation'}
    >
      {navigationItems.map((item) => {
        const current = isCurrentPath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.navigationLink}
            aria-current={current ? 'page' : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { authenticated, initialized, sessionRecovering, login, logout, user } = useAuth();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  }, [pathname]);

  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  }

  if (!initialized || sessionRecovering) {
    return <div className={styles.userPlaceholder} aria-hidden="true" />;
  }

  if (!authenticated || !user) {
    return (
      <button type="button" className={styles.loginButton} onClick={() => void login()}>
        Anmelden
      </button>
    );
  }

  const adminDestination = getAdminMenuDestination(user);

  return (
    <details ref={menuRef} className={styles.userMenu}>
      <summary className={styles.userMenuTrigger}>
        <span className={styles.userAvatar} aria-hidden="true">
          {user.fanPreference === 'CLUB' ? '⚽' : 'KF'}
        </span>
        <span className={styles.userMenuLabel}>Mein Konto</span>
        <span className={styles.userMenuChevron} aria-hidden="true">
          ▾
        </span>
      </summary>

      <div className={styles.userMenuPanel}>
        <div className={styles.userMenuMeta}>
          <strong>Kurvenfunk Konto</strong>
          <span>
            {user.fanPreference === 'CLUB'
              ? 'Vereinsfan'
              : user.fanPreference === 'NEUTRAL'
                ? 'Neutral'
                : 'Noch nicht gewählt'}
          </span>
        </div>

        <Link href="/profil" className={styles.userMenuItem} onClick={closeMenu}>
          Mein Profil
        </Link>

        <Link href="/einstellungen" className={styles.userMenuItem} onClick={closeMenu}>
          Einstellungen
        </Link>

        {adminDestination ? (
          <Link href={adminDestination} className={styles.userMenuItem} onClick={closeMenu}>
            Admin-Bereich
          </Link>
        ) : null}

        <button
          type="button"
          className={styles.userMenuItem}
          onClick={() => {
            closeMenu();
            void logout();
          }}
        >
          Abmelden
        </button>
      </div>
    </details>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerAccent} />

        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Kurvenfunk Startseite">
            <span className={styles.brandMark} aria-hidden="true">
              KF
            </span>
            <span className={styles.brandName}>Kurvenfunk</span>
          </Link>

          <Navigation />

          <div className={styles.headerActions}>
            <UserMenu />

            <button
              type="button"
              className={styles.mobileMenuButton}
              aria-label={mobileOpen ? 'Navigation schließen' : 'Navigation öffnen'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span aria-hidden="true">{mobileOpen ? '×' : '☰'}</span>
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div id="mobile-navigation" className={styles.mobileMenu} ref={mobileMenuRef}>
            <Navigation mobile onNavigate={() => setMobileOpen(false)} />
          </div>
        ) : null}
      </header>

      <main className={styles.main}>
        <div className={styles.contentContainer}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <Link href="/" className={styles.footerBrand}>
              Kurvenfunk
            </Link>
            <p>Fußball. News. Community.</p>
          </div>

          <nav className={styles.footerNavigation} aria-label="Footer Navigation">
            <Link href="/news">News</Link>
            <Link href="/spiele">Spiele</Link>
            <Link href="/tabelle">Tabelle</Link>
            <Link href="/forum">Forum</Link>
          </nav>

          <span className={styles.footerCopyright}>© {new Date().getFullYear()} Kurvenfunk</span>
        </div>
      </footer>
    </div>
  );
}
