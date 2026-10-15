export type CommentSortMode = 'newest' | 'oldest' | 'popular';

interface SortableComment {
  id: string;
  parentId: string | null;
  createdAt: string;
}

interface CommentScore {
  score: number;
}

export function sortTopLevelComments<T extends SortableComment>(
  comments: readonly T[],
  summaries: Readonly<Record<string, CommentScore | undefined>>,
  mode: CommentSortMode,
): T[] {
  const topLevel = comments.filter((comment) => comment.parentId === null);

  return topLevel.sort((left, right) => {
    if (mode === 'popular') {
      const leftScore = summaries[left.id]?.score ?? 0;
      const rightScore = summaries[right.id]?.score ?? 0;

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }
    }

    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);

    if (leftTime !== rightTime) {
      return mode === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
    }

    return left.id.localeCompare(right.id);
  });
}
