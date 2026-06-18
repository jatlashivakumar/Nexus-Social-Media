import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

export const useDebounce = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
};

export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const fn = (e) => { if (!ref.current || ref.current.contains(e.target)) return; handler(e); };
    document.addEventListener('mousedown', fn);
    document.addEventListener('touchstart', fn);
    return () => { document.removeEventListener('mousedown', fn); document.removeEventListener('touchstart', fn); };
  }, [ref, handler]);
};

export const useInfiniteScroll = ({ queryKey, queryFn, limit = 20, enabled = true }) => {
  const { ref, inView } = useInView({ threshold: 0.1 });
  const q = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => queryFn({ page: pageParam, limit }),
    getNextPageParam: (last) => { const { page, totalPages } = last?.meta || {}; return page < totalPages ? page + 1 : undefined; },
    initialPageParam: 1,
    enabled,
  });
  useEffect(() => { if (inView && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage(); }, [inView, q.hasNextPage, q.isFetchingNextPage]);
  const items = q.data?.pages?.flatMap(p => p.data) ?? [];
  return { ...q, items, loaderRef: ref };
};

export const useTypingIndicator = (conversationId) => {
  const { getSocket } = require('./useSocket');
  const isTyping = useRef(false);
  const timer    = useRef(null);

  const startTyping = useCallback(() => {
    const s = getSocket(); if (!s || !conversationId) return;
    if (!isTyping.current) { isTyping.current = true; s.emit('typing_start', { conversationId }); }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { isTyping.current = false; s.emit('typing_stop', { conversationId }); }, 2000);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    const s = getSocket(); if (!s || !conversationId) return;
    clearTimeout(timer.current);
    if (isTyping.current) { isTyping.current = false; s.emit('typing_stop', { conversationId }); }
  }, [conversationId]);

  return { startTyping, stopTyping };
};
