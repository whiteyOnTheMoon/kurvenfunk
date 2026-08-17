import { StandingsPage } from '../../features/standings/standings-page';
import { env } from '../../lib/env';

export default function TablePage() {
  return <StandingsPage apiUrl={env.API_URL} />;
}
