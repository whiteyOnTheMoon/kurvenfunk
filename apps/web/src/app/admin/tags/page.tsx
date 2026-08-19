import { TagAdmin } from '../../../features/admin/tags/tag-admin';
import { env } from '../../../lib/env';

export default function AdminTagsPage() {
  return <TagAdmin apiUrl={env.API_URL} />;
}
