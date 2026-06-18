import { useRef, useCallback } from 'react';
import { getSocket } from './useSocket';

export const useTypingIndicator = (conversationId) => {
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
