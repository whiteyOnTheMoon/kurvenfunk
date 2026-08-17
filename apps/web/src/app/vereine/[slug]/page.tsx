import { notFound } from 'next/navigation';

import { ClubDetail, type ClubDetailData } from '../../../features/clubs/club-detail';

interface ClubPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface ClubResponse {
  data: ClubDetailData;
}

async function getClub(slug: string): Promise<ClubDetailData | null> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error('API_URL is not configured');
  }

  const response = await fetch(`${apiUrl}/api/v1/clubs/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Club could not be loaded');
  }

  const payload = (await response.json()) as ClubResponse;

  return payload.data;
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params;
  const club = await getClub(slug);

  if (!club) {
    notFound();
  }

  return <ClubDetail club={club} />;
}
