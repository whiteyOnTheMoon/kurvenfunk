import { ClubAdmin } from '../../../features/admin/clubs/club-admin';
import { CompetitionAdmin } from '../../../features/admin/competitions/competition-admin';
import { MatchAdmin } from '../../../features/admin/matches/match-admin';
import { ResultAdmin } from '../../../features/admin/results/result-admin';
import { SeasonAdmin } from '../../../features/admin/seasons/season-admin';
import { env } from '../../../lib/env';

export default function AdminSportsDataPage() {
  return (
    <>
      <CompetitionAdmin apiUrl={env.API_URL} />
      <SeasonAdmin apiUrl={env.API_URL} />
      <ClubAdmin apiUrl={env.API_URL} />
      <MatchAdmin apiUrl={env.API_URL} />
      <ResultAdmin apiUrl={env.API_URL} />
    </>
  );
}
