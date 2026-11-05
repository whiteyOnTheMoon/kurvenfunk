import { CommentReportQueue } from '../../../features/admin/moderation/comment-report-queue';
import { env } from '../../../lib/env';

export default function AdminModerationPage() {
  return <CommentReportQueue apiUrl={env.API_URL} />;
}
