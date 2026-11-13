import { ForumReportQueue } from '../../../features/forum/forum-report-queue';
import { env } from '../../../lib/env';

export default function AdminForumPage() {
  return <ForumReportQueue apiUrl={env.API_URL} />;
}
