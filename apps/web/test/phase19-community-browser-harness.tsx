import React from 'react';
import { createRoot } from 'react-dom/client';

import { CommentReport } from '../src/features/articles/comment-report';
import { CommentVoting, type VoteSummary } from '../src/features/articles/comment-voting';

const apiUrl = window.location.origin;

function votes(commentId: string): VoteSummary {
  return {
    commentId,
    upvotes: 0,
    downvotes: 0,
    score: 0,
    viewerVote: null,
  };
}

function App() {
  return (
    <main>
      <section aria-label="Active voting">
        <CommentVoting
          apiUrl={apiUrl}
          commentId="active-comment"
          authorId="another-user"
          userId="viewer"
          userStatus="ACTIVE"
          token="isolated-browser-test-token"
          summary={votes('active-comment')}
        />
      </section>
      <section aria-label="Limited voting">
        <CommentVoting
          apiUrl={apiUrl}
          commentId="limited-comment"
          authorId="another-user"
          userId="viewer"
          userStatus="LIMITED"
          token="isolated-browser-test-token"
          summary={votes('limited-comment')}
        />
      </section>
      <section aria-label="Self voting">
        <CommentVoting
          apiUrl={apiUrl}
          commentId="self-comment"
          authorId="viewer"
          userId="viewer"
          userStatus="ACTIVE"
          token="isolated-browser-test-token"
          summary={votes('self-comment')}
        />
      </section>
      <section aria-label="Banned voting">
        <CommentVoting
          apiUrl={apiUrl}
          commentId="banned-comment"
          authorId="another-user"
          userId="viewer"
          userStatus="BANNED"
          token="isolated-browser-test-token"
          summary={votes('banned-comment')}
        />
      </section>
      <section aria-label="Comment reporting">
        <CommentReport
          apiUrl={apiUrl}
          commentId="report-comment"
          authorId="another-user"
          userId="viewer"
          userStatus="ACTIVE"
          token="isolated-browser-test-token"
        />
      </section>
      <section aria-label="Self reporting">
        <CommentReport
          apiUrl={apiUrl}
          commentId="self-report-comment"
          authorId="viewer"
          userId="viewer"
          userStatus="ACTIVE"
          token="isolated-browser-test-token"
        />
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
