import { UserModerationHistory } from '../../../../../features/admin/moderation/user-moderation-history';
import { env } from '../../../../../lib/env';

export default async function UserModerationHistoryPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <UserModerationHistory apiUrl={env.API_URL} userId={userId} />;
}
