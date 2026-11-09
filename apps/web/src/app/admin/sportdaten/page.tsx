import { CompetitionAdmin } from '../../../features/admin/competitions/competition-admin';
import { env } from '../../../lib/env';

export default function AdminSportsDataPage() {
  return <CompetitionAdmin apiUrl={env.API_URL} />;
}
