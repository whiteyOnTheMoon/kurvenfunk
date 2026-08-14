import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AuthProvider } from '../features/auth/auth-provider';
import { OnboardingGate } from '../features/onboarding/onboarding-gate';
import { env } from '../lib/env';
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

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider apiUrl={env.API_URL} authUrl={env.AUTH_URL}>
          <OnboardingGate>{children}</OnboardingGate>
        </AuthProvider>
      </body>
    </html>
  );
}
