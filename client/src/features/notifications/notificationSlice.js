import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0 },
  reducers: {
    setNotifications: (s,a) => { s.items = a.payload; },
    addNotification:  (s,a) => { s.items.unshift(a.payload); s.unreadCount += 1; },
    setUnreadCount:   (s,a) => { s.unreadCount = a.payload; },
    markAllRead:      (s)   => { s.items = s.items.map(n=>({...n,isRead:true})); s.unreadCount = 0; },
    removeNotification:(s,a)=> { s.items = s.items.filter(n=>n._id!==a.payload); },
  },
});

export const { setNotifications, addNotification, setUnreadCount, markAllRead, removeNotification } = slice.actions;
export const selectNotifications = (s) => s.notifications.items;
export const selectUnreadCount   = (s) => s.notifications.unreadCount;
export default slice.reducer;
