'use client';

import { useEffect } from 'react';
import { useAuth } from '../auth/auth-provider';
import {
  clubThemeToCssProperties,
  resolveClubTheme,
  resolveDefaultKurvenfunkTheme,
  type ClubThemeInput,
} from './club-theme';

interface PersonalizedClubThemeProps {
  apiUrl: string;
}

interface ClubListItem extends ClubThemeInput {
  id: string;
}

interface ClubsResponse {
  data?: ClubListItem[];
}

function applyTheme(theme: ReturnType<typeof resolveClubTheme>, mode: 'club' | 'default'): void {
  const properties = clubThemeToCssProperties(theme);

  for (const [property, value] of Object.entries(properties)) {
    document.documentElement.style.setProperty(property, value);
  }

  document.documentElement.dataset.kfTheme = mode;
}

function applyDefaultTheme(): void {
  applyTheme(resolveDefaultKurvenfunkTheme(), 'default');
}

export function PersonalizedClubTheme({ apiUrl }: PersonalizedClubThemeProps) {
  const { authenticated, initialized, user } = useAuth();

  useEffect(() => {
    const controller = new AbortController();

    if (
      !initialized ||
      !authenticated ||
      !user ||
      user.fanPreference !== 'CLUB' ||
      !user.favoriteClubId
    ) {
      applyDefaultTheme();
      return () => controller.abort();
    }

    const favoriteClubId = user.favoriteClubId;

    async function applyFavoriteClubTheme() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/clubs`, {
          signal: controller.signal,
        });

        const body = (await response.json().catch(() => undefined)) as ClubsResponse | undefined;

        if (!response.ok || !Array.isArray(body?.data)) {
          applyDefaultTheme();
          return;
        }

        const favoriteClub = body.data.find((club) => club.id === favoriteClubId);

        if (!favoriteClub) {
          applyDefaultTheme();
          return;
        }

        applyTheme(resolveClubTheme(favoriteClub), 'club');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        applyDefaultTheme();
      }
    }

    void applyFavoriteClubTheme();

    return () => controller.abort();
  }, [apiUrl, authenticated, initialized, user]);

  return null;
}
