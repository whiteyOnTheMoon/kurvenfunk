'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

import { useAuth } from '../auth/auth-provider';

interface OnboardingGateProps {
  children: ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { authenticated, initialized, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const requiresOnboarding =
    initialized && authenticated && user !== undefined && !user.onboardingCompleted;

  useEffect(() => {
    if (requiresOnboarding && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [pathname, requiresOnboarding, router]);

  if (requiresOnboarding && pathname !== '/onboarding') {
    return <p>Preparing your Kurvenfunk account…</p>;
  }

  return children;
}
