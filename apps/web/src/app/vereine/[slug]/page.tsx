import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ClubDetail, type ClubOverviewData } from '../../../features/clubs/club-detail';

interface ClubPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface ClubResponse {
  data: ClubOverviewData;
}

async function getClubOverview(slug: string): Promise<ClubOverviewData | null> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error('API_URL is not configured');
  }

  const response = await fetch(`${apiUrl}/api/v1/clubs/${encodeURIComponent(slug)}/overview`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Club overview could not be loaded');
  }

  const payload = (await response.json()) as ClubResponse;
  return payload.data;
}

export async function generateMetadata({ params }: ClubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const overview = await getClubOverview(slug);
  if (!overview) {
    return { title: 'Verein nicht gefunden | Kurvenfunk', robots: { index: false } };
  }

  return {
    title: `${overview.club.name} | Kurvenfunk`,
    description: `Aktuelle Vereinsnews, Spiele, Ergebnisse und Tabellenstände für ${overview.club.name}.`,
  };
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params;
  const overview = await getClubOverview(slug);

  if (!overview) {
    notFound();
  }

  return <ClubDetail overview={overview} apiUrl={process.env.API_URL!} />;
}
