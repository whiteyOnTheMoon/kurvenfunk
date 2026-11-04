import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

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
  title: 'KURVENFUNK – Alle News zum österreichischen Fußball',
  description:
    'Wir machen keine Welle. Wir machen Fußball. KURVENFUNK startet am 1. Jänner 2027 – alle News zum österreichischen Fußball.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'KURVENFUNK – Wir machen Fußball.',
    description: 'Alle News zum österreichischen Fußball. Ab 1. Jänner 2027.',
    locale: 'de_AT',
    type: 'website',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de-AT" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
