import { MediaLibrary } from '../../../features/admin/media/media-library';
import { env } from '../../../lib/env';

export default function AdminMediaPage() {
  return <MediaLibrary apiUrl={env.API_URL} />;
}
