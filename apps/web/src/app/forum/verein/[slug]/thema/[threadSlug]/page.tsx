import { ClubThreadDetail } from '../../../../../../features/forum/club-thread-detail';
import { env } from '../../../../../../lib/env';

export default async function ClubThreadDetailRoute({
  params,
}: {
  params: Promise<{ slug: string; threadSlug: string }>;
}) {
  const { slug, threadSlug } = await params;
  return <ClubThreadDetail apiUrl={env.API_URL} clubSlug={slug} threadSlug={threadSlug} />;
}
