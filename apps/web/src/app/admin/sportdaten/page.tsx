import { CompetitionAdmin } from '../../../features/admin/competitions/competition-admin';
import { SeasonAdmin } from '../../../features/admin/seasons/season-admin';
import { env } from '../../../lib/env';

export default function AdminSportsDataPage() {
  return (
    <>
      <CompetitionAdmin apiUrl={env.API_URL} />
      <SeasonAdmin apiUrl={env.API_URL} />
    </>
  );
}
