import api from '@/api/axios';

// Auth
export const authApi = {
  login:          (d)      => api.post('/auth/login', d),
  register:       (d)      => api.post('/auth/register', d),
  logout:         ()       => api.post('/auth/logout'),
  getMe:          ()       => api.get('/auth/me'),
  forgotPassword: (email)  => api.post('/auth/forgot-password', { email }),
  resetPassword:  (tok,pw) => api.patch(`/auth/reset-password/${tok}`, { password: pw }),
  changePassword: (d)      => api.patch('/auth/change-password', d),
  verifyEmail:    (tok)    => api.get(`/auth/verify-email/${tok}`),
};

// Users
export const userApi = {
  getProfile:   (u)   => api.get(`/users/${u}`),
  updateProfile:(d)   => api.patch('/users/me/profile', d, { headers:{ 'Content-Type':'multipart/form-data' } }),
  follow:       (id)  => api.post(`/users/${id}/follow`),
  block:        (id)  => api.post(`/users/${id}/block`),
  getFollowers: (u,p) => api.get(`/users/${u}/followers`, { params:p }),
  getFollowing: (u,p) => api.get(`/users/${u}/following`, { params:p }),
  search:       (q,p) => api.get('/users/search', { params:{ q,...p } }),
  getSuggested: ()    => api.get('/users/suggested'),
  deactivate:   (pw)  => api.delete('/users/me/deactivate', { data:{ password:pw } }),
};

// Posts
export const postApi = {
  getFeed:      (p)      => api.get('/posts/feed', { params:p }),
  getExplore:   (p)      => api.get('/posts/explore', { params:p }),
  getPost:      (id)     => api.get(`/posts/${id}`),
  getUserPosts: (u,p)    => api.get(`/posts/user/${u}`, { params:p }),
  create:       (d)      => api.post('/posts', d, { headers:{ 'Content-Type':'multipart/form-data' } }),
  delete:       (id)     => api.delete(`/posts/${id}`),
  like:         (id)     => api.post(`/posts/${id}/like`),
  save:         (id)     => api.post(`/posts/${id}/save`),
  addComment:   (id,c)   => api.post(`/posts/${id}/comments`, { content:c }),
  deleteComment:(pid,cid)=> api.delete(`/posts/${pid}/comments/${cid}`),
  search:       (p)      => api.get('/posts/search', { params:p }),
};

// Chat
export const chatApi = {
  getConversations:  (p)    => api.get('/chat', { params:p }),
  getDMConversation: (uid)  => api.post(`/chat/dm/${uid}`),
  getMessages:       (cid,p)=> api.get(`/chat/${cid}/messages`, { params:p }),
  sendMessage:       (cid,d)=> api.post(`/chat/${cid}/messages`, d),
  deleteMessage:     (mid)  => api.delete(`/chat/messages/${mid}`),
  createGroup:       (d)    => api.post('/chat/group', d),
};

// Notifications
export const notificationApi = {
  getAll:        (p)   => api.get('/notifications', { params:p }),
  getUnreadCount:()    => api.get('/notifications/unread-count'),
  markRead:      (ids) => api.patch('/notifications/read', { notificationIds:ids }),
  markAllRead:   ()    => api.patch('/notifications/read'),
  delete:        (id)  => api.delete(`/notifications/${id}`),
};

// Payments / Subscriptions 
export const paymentApi = {
  getSubscription: () =>
    api.get('/payments/subscription'),

  upgradePlan: (plan) =>
    api.post('/payments/upgrade', { plan }),
};