import { ModerationDashboard } from '../../../features/admin/moderation/moderation-dashboard';
import { env } from '../../../lib/env';

export default function AdminModerationPage() {
  return <ModerationDashboard apiUrl={env.API_URL} />;
}
