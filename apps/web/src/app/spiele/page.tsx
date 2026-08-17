import { MatchSchedulePage } from '../../features/matches/match-schedule-page';
import { env } from '../../lib/env';

export default function MatchesPage() {
  return <MatchSchedulePage apiUrl={env.API_URL} />;
}
