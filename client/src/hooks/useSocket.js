import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { addNotification } from '@/features/notifications/notificationSlice';
import { addMessage, removeMessage, setTyping } from '@/features/chat/chatSlice';
import toast from 'react-hot-toast';

let socket = null;
export const getSocket = () => socket;

export const useSocketInit = () => {
  const dispatch = useDispatch();
  const isAuth   = useSelector(selectIsAuthenticated);
  const init     = useRef(false);

  useEffect(() => {
    if (!isAuth || init.current) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    init.current = true;

    socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token }, withCredentials: true, reconnectionAttempts: 5,
    });

    socket.on('notification', (n) => { dispatch(addNotification(n)); toast(n.message, { icon: '🔔' }); });
    socket.on('new_message',  (m) => dispatch(addMessage({ conversationId: m.conversation, message: m })));
    socket.on('message_deleted', ({ messageId, conversationId }) => dispatch(removeMessage({ conversationId, messageId })));
    socket.on('message_notification', ({ conversationId, message }) => {
      if (window.location.pathname !== `/chat/${conversationId}`)
        toast(`💬 ${message.sender?.username}: ${message.content?.slice(0,50) || 'Sent a file'}`);
    });
    socket.on('typing_start', ({ conversationId, userId }) => dispatch(setTyping({ conversationId, userId, isTyping: true })));
    socket.on('typing_stop',  ({ conversationId, userId }) => dispatch(setTyping({ conversationId, userId, isTyping: false })));

    return () => { if (socket) { socket.disconnect(); socket = null; init.current = false; } };
  }, [isAuth, dispatch]);
};
