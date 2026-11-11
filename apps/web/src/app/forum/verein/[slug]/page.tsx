import { ClubForumPage } from '../../../../features/forum/club-forum-page';
import { env } from '../../../../lib/env';

export default async function ClubForumRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ClubForumPage apiUrl={env.API_URL} clubSlug={slug} />;
}
