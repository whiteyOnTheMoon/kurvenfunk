import { ArticleDiscussionDirectory } from '../../../features/forum/article-discussion-directory';
import { env } from '../../../lib/env';

export default function ForumArticleDiscussionsPage() {
  return <ArticleDiscussionDirectory apiUrl={env.API_URL} />;
}
