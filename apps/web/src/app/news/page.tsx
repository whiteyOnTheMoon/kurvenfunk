import { NewsOverview } from '../../features/articles/news-overview';
import { env } from '../../lib/env';

export default function NewsPage() {
  return <NewsOverview apiUrl={env.API_URL} />;
}
