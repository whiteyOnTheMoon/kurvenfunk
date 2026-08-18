import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { CSSProperties } from 'react';

import { RouteShell } from '../components/layout/route-shell';
import { AuthProvider } from '../features/auth/auth-provider';
import { OnboardingGate } from '../features/onboarding/onboarding-gate';
import {
  clubThemeToCssProperties,
  resolveDefaultKurvenfunkTheme,
} from '../features/personalization/club-theme';
import { PersonalizedClubTheme } from '../features/personalization/personalized-club-theme';
import { env } from '../lib/env';

import '@kurvenfunk/ui/tokens.css';
import '@kurvenfunk/ui/components.css';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kurvenfunk',
  description: 'Austrian football news and community',
};

const defaultKurvenfunkThemeStyle = clubThemeToCssProperties(
  resolveDefaultKurvenfunkTheme(),
) as CSSProperties;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={defaultKurvenfunkThemeStyle}
    >
      <body>
        <AuthProvider apiUrl={env.API_URL} authUrl={env.AUTH_URL}>
          <PersonalizedClubTheme apiUrl={env.API_URL} />
          <OnboardingGate>
            <RouteShell>{children}</RouteShell>
          </OnboardingGate>
        </AuthProvider>
      </body>
    </html>
  );
}
