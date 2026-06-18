import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

export const useInfiniteScroll = ({ queryKey, queryFn, limit = 20, enabled = true }) => {
  const { ref, inView } = useInView({ threshold: 0.1 });
  const q = useInfiniteQuery({
    queryKey, enabled,
    queryFn: ({ pageParam = 1 }) => queryFn({ page: pageParam, limit }),
    getNextPageParam: (last) => { const { page, totalPages } = last?.meta || {}; return page < totalPages ? page + 1 : undefined; },
    initialPageParam: 1,
  });
  useEffect(() => { if (inView && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage(); }, [inView, q.hasNextPage, q.isFetchingNextPage]);
  const items = q.data?.pages?.flatMap(p => p.data) ?? [];
  return { ...q, items, loaderRef: ref };
};
