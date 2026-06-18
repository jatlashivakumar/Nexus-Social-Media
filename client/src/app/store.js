import { configureStore } from '@reduxjs/toolkit';
import authReducer         from '@/features/auth/authSlice';
import uiReducer           from '@/features/ui/uiSlice';
import chatReducer         from '@/features/chat/chatSlice';
import notificationReducer from '@/features/notifications/notificationSlice';
import userReducer         from '@/features/users/userSlice';
import postReducer         from '@/features/posts/postSlice';

/**
 * Redux store — single source of truth for:
 * auth, ui (theme/modals), chat, notifications, user profiles, post states
 */
export const store = configureStore({
  reducer: {
    auth:          authReducer,
    ui:            uiReducer,
    chat:          chatReducer,
    notifications: notificationReducer,
    users:         userReducer,
    posts:         postReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
