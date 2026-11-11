import { ForumOverview } from '../../../../features/forum/forum-overview';
import { env } from '../../../../lib/env';

export default async function ForumCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ForumOverview apiUrl={env.API_URL} categorySlug={slug} />;
}
