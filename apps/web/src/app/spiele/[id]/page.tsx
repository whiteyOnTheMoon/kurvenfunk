import { notFound } from 'next/navigation';

import { MatchDetail, type MatchDetailData } from '../../../features/matches/match-detail';

interface MatchPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface MatchResponse {
  data: MatchDetailData;
}

async function getMatch(id: string): Promise<MatchDetailData | null> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error('API_URL is not configured');
  }

  const response = await fetch(`${apiUrl}/api/v1/matches/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Match could not be loaded');
  }

  const payload = (await response.json()) as MatchResponse;

  return payload.data;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    notFound();
  }

  return <MatchDetail match={match} />;
}
