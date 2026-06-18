import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'chat',
  initialState: { conversations: [], activeConversationId: null, messages: {}, typingUsers: {}, unreadCounts: {} },
  reducers: {
    setConversations:      (s,a) => { s.conversations = a.payload; },
    addConversation:       (s,a) => { if (!s.conversations.find(c=>c._id===a.payload._id)) s.conversations.unshift(a.payload); },
    setActiveConversation: (s,a) => { s.activeConversationId = a.payload; },
    setMessages:           (s,a) => { s.messages[a.payload.conversationId] = a.payload.messages; },
    prependMessages:       (s,a) => { s.messages[a.payload.conversationId] = [...a.payload.messages, ...(s.messages[a.payload.conversationId]||[])]; },
    addMessage:            (s,a) => {
      const { conversationId, message } = a.payload;
      if (!s.messages[conversationId]) s.messages[conversationId] = [];
      if (!s.messages[conversationId].find(m=>m._id===message._id)) s.messages[conversationId].push(message);
      const conv = s.conversations.find(c=>c._id===conversationId);
      if (conv) { conv.lastMessage = message; conv.lastActivity = message.createdAt; s.conversations = [conv, ...s.conversations.filter(c=>c._id!==conversationId)]; }
    },
    removeMessage: (s,a) => { const { conversationId, messageId } = a.payload; if (s.messages[conversationId]) s.messages[conversationId] = s.messages[conversationId].filter(m=>m._id!==messageId); },
    setTyping:     (s,a) => { const { conversationId, userId, isTyping } = a.payload; if (!s.typingUsers[conversationId]) s.typingUsers[conversationId]=[]; if (isTyping) { if (!s.typingUsers[conversationId].includes(userId)) s.typingUsers[conversationId].push(userId); } else s.typingUsers[conversationId]=s.typingUsers[conversationId].filter(i=>i!==userId); },
    setUnreadCount:(s,a) => { s.unreadCounts[a.payload.conversationId] = a.payload.count; },
    clearUnread:   (s,a) => { s.unreadCounts[a.payload] = 0; },
  },
});

export const { setConversations, addConversation, setActiveConversation, setMessages, prependMessages, addMessage, removeMessage, setTyping, setUnreadCount, clearUnread } = slice.actions;
export const selectConversations        = (s) => s.chat.conversations;
export const selectActiveConversationId = (s) => s.chat.activeConversationId;
export const selectMessages             = (id) => (s) => s.chat.messages[id] || [];
export const selectTypingUsers          = (id) => (s) => s.chat.typingUsers[id] || [];
export const selectTotalUnread          = (s) => Object.values(s.chat.unreadCounts).reduce((a,b)=>a+b,0);
export default slice.reducer;
