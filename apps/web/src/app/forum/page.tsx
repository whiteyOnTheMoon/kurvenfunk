import { ForumOverview } from '../../features/forum/forum-overview';
import { env } from '../../lib/env';

export default function ForumPage() {
  return <ForumOverview apiUrl={env.API_URL} />;
}
