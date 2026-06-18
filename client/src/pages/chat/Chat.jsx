import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiSendPlaneFill, RiArrowLeftLine, RiCheckDoubleLine, RiCheckLine,
  RiAddLine, RiSearchLine, RiCloseLine, RiLoader4Line,
  RiEmotionLine, RiImageAddLine, RiGroupLine, RiUserLine,
} from 'react-icons/ri';
import { chatApi, userApi } from '@/services/api';
import { selectUser } from '@/features/auth/authSlice';
import {
  selectConversations, selectMessages, selectTypingUsers,
  setConversations, setMessages, addMessage, addConversation,
  setActiveConversation, clearUnread,
} from '@/features/chat/chatSlice';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useDebounce } from '@/hooks/useDebounce';
import { getSocket } from '@/hooks/useSocket';
import Avatar from '@/components/ui/Avatar';
import { cn, formatMessageTime, getAvatarUrl, timeAgo } from '@/utils';
import toast from 'react-hot-toast';

/* ── Helpers ──────────────────────────────────────────────────── */
const getConvName = (conv, me) => {
  if (!conv) return '';
  if (conv.type === 'group') return conv.name || 'Group Chat';
  const other = conv.participants?.find(p => p.user?._id !== me?._id)?.user;
  return other?.name || other?.username || 'Unknown';
};

const getConvAvatar = (conv, me) => {
  if (conv?.type === 'group') return conv.avatar?.url || null;
  const other = conv?.participants?.find(p => p.user?._id !== me?._id)?.user;
  return getAvatarUrl(other);
};

const getOtherUser = (conv, me) =>
  conv?.participants?.find(p => p.user?._id !== me?._id)?.user;

const groupByDate = (msgs) =>
  msgs.reduce((acc, msg) => {
    const d = new Date(msg.createdAt), now = new Date(), yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const label =
      d.toDateString() === now.toDateString() ? 'Today' :
      d.toDateString() === yest.toDateString() ? 'Yesterday' :
      d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    (acc[label] = acc[label] || []).push(msg);
    return acc;
  }, {});

/* ── NewDM Modal ──────────────────────────────────────────────── */
function NewDMModal({ onClose, onStarted }) {
  const [query,    setQuery]    = useState('');
  const [starting, setStarting] = useState(null);
  const dq = useDebounce(query, 350);

  const { data: users, isLoading } = useQuery({
    queryKey: ['dmUserSearch', dq],
    queryFn: () => userApi.search(dq || '', { limit: 12 }).then(r => r.data.data),
  });

  const handleStart = async (user) => {
    if (starting) return;
    setStarting(user._id);
    try {
      const { data } = await chatApi.getDMConversation(user._id);
      onStarted(data.data);   // pass full conversation object back
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not start conversation');
      setStarting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
        className="relative z-10 w-full max-w-sm bg-base border border-base rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-base">
          <h2 className="font-bold text-base">New message</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-base-3 text-muted">
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* search */}
        <div className="px-3 py-3 border-b border-base">
          <div className="relative">
            <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people to message…"
              className="input-base pl-8 py-2 text-sm"
            />
          </div>
        </div>

        {/* results */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-10">
              <RiLoader4Line size={24} className="animate-spin text-muted" />
            </div>
          )}
          {!isLoading && users?.length === 0 && (
            <div className="flex flex-col items-center py-12 text-muted gap-2">
              <RiUserLine size={32} className="opacity-30" />
              <p className="text-sm font-medium">
                {query ? `No users found for "${query}"` : 'Search for someone to message'}
              </p>
            </div>
          )}
          {users?.map(u => (
            <button
              key={u._id}
              onClick={() => handleStart(u)}
              disabled={!!starting}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-base-3 transition-colors text-left disabled:opacity-60"
            >
              <Avatar src={getAvatarUrl(u)} alt={u.username} size={44} online={u.onlineStatus === 'online'} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.name || u.username}</p>
                <p className="text-xs text-muted truncate">@{u.username}</p>
              </div>
              {starting === u._id ? (
                <RiLoader4Line size={16} className="animate-spin text-brand flex-shrink-0" />
              ) : (
                <span className="text-xs text-brand font-semibold flex-shrink-0">Message</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Chat component ──────────────────────────────────────── */
export default function Chat() {
  const { conversationId } = useParams();
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const qc          = useQueryClient();
  const me          = useSelector(selectUser);
  const convs       = useSelector(selectConversations);
  const [search,    setSearch]  = useState('');
  const [showNewDM, setShowNewDM] = useState(false);

  /* Load conversations */
  const { isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations().then(r => r.data.data),
    onSuccess: d => dispatch(setConversations(d)),
    refetchInterval: 60_000,
  });

  /* Set active conversation */
  useEffect(() => {
    if (conversationId) {
      dispatch(setActiveConversation(conversationId));
      dispatch(clearUnread(conversationId));
    }
  }, [conversationId, dispatch]);

  /* Handle new DM started from modal */
  const handleNewConversationStarted = (conv) => {
    // Add to Redux store immediately so it appears in the list
    dispatch(addConversation(conv));
    // Invalidate so the list refetches fresh data in background
    qc.invalidateQueries({ queryKey: ['conversations'] });
    // Navigate to the conversation
    navigate(`/chat/${conv._id}`);
  };

  const filtered = convs.filter(c =>
    !search.trim() || getConvName(c, me).toLowerCase().includes(search.toLowerCase())
  );
  const active = convs.find(c => c._id === conversationId);

  return (
    <>
      <Helmet><title>Messages · Nexus</title></Helmet>

      {/* New DM Modal */}
      <AnimatePresence>
        {showNewDM && (
          <NewDMModal
            onClose={() => setShowNewDM(false)}
            onStarted={handleNewConversationStarted}
          />
        )}
      </AnimatePresence>

      <div className="flex h-[calc(100svh-5rem)] -mx-4 -my-6 bg-base rounded-2xl border border-base overflow-hidden">

        {/* ── Sidebar ── */}
        <div className={cn(
          'flex flex-col w-full sm:w-80 xl:w-96 border-r border-base flex-shrink-0',
          conversationId ? 'hidden sm:flex' : 'flex',
        )}>
          {/* Header */}
          <div className="p-4 border-b border-base flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Messages</h2>
              <button
                onClick={() => setShowNewDM(true)}
                title="New message"
                className="w-9 h-9 rounded-xl bg-brand/10 hover:bg-brand text-brand hover:text-white flex items-center justify-center transition-all"
              >
                <RiAddLine size={20} />
              </button>
            </div>
            <div className="relative">
              <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="input-base pl-8 py-2 text-sm"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {convsLoading && (
              <div className="p-3 space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-3 animate-pulse">
                    <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="skeleton h-3.5 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!convsLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-52 text-muted gap-3 px-6">
                <div className="w-16 h-16 rounded-2xl bg-base-3 flex items-center justify-center">
                  <RiGroupLine size={28} className="opacity-40" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">No conversations yet</p>
                  <p className="text-xs mt-1 text-muted">Tap + to start a new chat</p>
                </div>
                <button onClick={() => setShowNewDM(true)} className="btn-primary btn text-sm px-4 py-2">
                  <RiAddLine size={15} /> New message
                </button>
              </div>
            )}

            {filtered.map(conv => {
              const other    = getOtherUser(conv, me);
              const name     = getConvName(conv, me);
              const isActive = conv._id === conversationId;
              const lastMsg  = conv.lastMessage;
              const preview  = lastMsg?.isDeleted ? 'Message deleted'
                : lastMsg?.type !== 'text' ? '📎 Attachment'
                : lastMsg?.content;

              return (
                <motion.button
                  key={conv._id}
                  onClick={() => navigate(`/chat/${conv._id}`)}
                  whileHover={{ x: 2 }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                    isActive ? 'bg-brand/8 border-r-2 border-brand' : 'hover:bg-base-2',
                  )}
                >
                  <Avatar src={getConvAvatar(conv, me)} alt={name} size={48} online={other?.onlineStatus === 'online'} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn('text-sm font-bold truncate', isActive && 'text-brand')}>{name}</p>
                      {lastMsg?.createdAt && (
                        <span className="text-[11px] text-muted flex-shrink-0 ml-2">
                          {formatMessageTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted truncate flex-1">
                        {lastMsg?.sender?._id === me?._id && <span className="font-semibold">You: </span>}
                        {preview || <span className="italic text-muted">Say hello 👋</span>}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-brand text-white text-[10px] font-bold px-1 flex-shrink-0">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Message pane ── */}
        {conversationId && active ? (
          <MessagePane
            key={conversationId}
            conv={active}
            conversationId={conversationId}
            me={me}
            dispatch={dispatch}
            onBack={() => navigate('/chat')}
          />
        ) : (
          <div className="flex-1 hidden sm:flex flex-col items-center justify-center gap-5 text-muted">
            <div className="w-20 h-20 rounded-2xl bg-brand/10 flex items-center justify-center">
              <RiSendPlaneFill size={36} className="text-brand opacity-70" />
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-primary">Your Messages</p>
              <p className="text-sm mt-1">Select a conversation or start a new one</p>
            </div>
            <button onClick={() => setShowNewDM(true)} className="btn-primary btn">
              <RiAddLine size={16} /> New message
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── MessagePane ──────────────────────────────────────────────── */
function MessagePane({ conv, conversationId, me, dispatch, onBack }) {
  const messages    = useSelector(selectMessages(conversationId));
  const typingUsers = useSelector(selectTypingUsers(conversationId));
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const endRef   = useRef(null);
  const textRef  = useRef(null);
  const { startTyping, stopTyping } = useTypingIndicator(conversationId);
  const other = getOtherUser(conv, me);
  const name  = getConvName(conv, me);

  /* Load messages */
  const { isLoading } = useQuery({
    queryKey: ['messages', conversationId, page],
    queryFn: () => chatApi.getMessages(conversationId, { page }).then(r => r.data),
    onSuccess: ({ data, meta }) => {
      if (page === 1) {
        dispatch(setMessages({ conversationId, messages: data }));
        setTimeout(() => endRef.current?.scrollIntoView(), 80);
      }
      setHasMore(meta.hasMore);
    },
    keepPreviousData: true,
  });

  /* Join socket room */
  useEffect(() => {
    const s = getSocket();
    s?.emit('join_conversation', conversationId);
    return () => s?.emit('leave_conversation', conversationId);
  }, [conversationId]);

  /* Scroll when new messages arrive */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const text = content.trim();
    if (!text || sending) return;
    setContent('');
    stopTyping();
    setSending(true);
    if (textRef.current) textRef.current.style.height = 'auto';
    try {
      await chatApi.sendMessage(conversationId, { content: text, type: 'text' });
    } catch (e) {
      setContent(text);
      toast.error(e?.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    startTyping();
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const grouped = groupByDate(messages);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-base">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-base glass flex-shrink-0">
        <button onClick={onBack} className="sm:hidden p-2 rounded-xl hover:bg-base-3 text-muted">
          <RiArrowLeftLine size={20} />
        </button>
        <Avatar src={getConvAvatar(conv, me)} alt={name} size={40} online={other?.onlineStatus === 'online'} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{name}</p>
          <p className="text-xs h-4">
            {typingUsers.length > 0
              ? <span className="text-brand animate-pulse font-medium">typing…</span>
              : other?.onlineStatus === 'online'
              ? <span className="text-green-500 font-semibold">● Online</span>
              : other?.lastSeen
              ? <span className="text-muted">Last seen {timeAgo(other.lastSeen)}</span>
              : null}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {hasMore && !isLoading && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setPage(p => p + 1)}
              className="text-xs text-brand bg-brand/8 hover:bg-brand/15 px-4 py-1.5 rounded-full font-semibold transition-colors"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {isLoading && page === 1 && (
          <div className="space-y-4 pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn('flex gap-2', i % 3 === 0 ? 'justify-end' : '')}>
                {i % 3 !== 0 && <div className="skeleton w-8 h-8 rounded-full" />}
                <div className={cn('skeleton rounded-2xl h-10', i % 3 === 0 ? 'w-44' : 'w-60')} />
              </div>
            ))}
          </div>
        )}

        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-base-3" />
              <span className="text-xs text-muted bg-base border border-base px-3 py-1 rounded-full font-medium">
                {date}
              </span>
              <div className="flex-1 h-px bg-base-3" />
            </div>

            {msgs.map((msg, idx) => {
              const isOwn = msg.sender?._id === me?._id || msg.sender === me?._id;
              const prevSame = idx > 0 && (
                msgs[idx - 1]?.sender?._id === msg.sender?._id ||
                msgs[idx - 1]?.sender === msg.sender
              );

              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    'flex items-end gap-2 mb-1',
                    isOwn ? 'justify-end' : 'justify-start',
                    prevSame ? 'mt-0.5' : 'mt-3',
                  )}
                >
                  {/* Other person avatar */}
                  {!isOwn && (
                    <div className="w-8 flex-shrink-0">
                      {!prevSame && (
                        <Avatar src={getAvatarUrl(msg.sender)} alt={msg.sender?.username} size={32} />
                      )}
                    </div>
                  )}

                  <div className={cn('max-w-[72%] group flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                    {/* Sender name in group chats */}
                    {!isOwn && !prevSame && conv.type === 'group' && (
                      <p className="text-[11px] text-muted mb-1 ml-1 font-bold">{msg.sender?.username}</p>
                    )}

                    {/* Message bubble */}
                    {(msg.content || msg.isDeleted) && (
                      <div className={cn(
                        'px-4 py-2.5 text-sm leading-relaxed break-words',
                        isOwn
                          ? 'bg-brand text-white rounded-2xl rounded-br-sm'
                          : 'bg-base-2 border border-base text-primary rounded-2xl rounded-bl-sm',
                        msg.isDeleted && 'opacity-40 italic',
                      )}>
                        {msg.isDeleted ? 'This message was deleted.' : msg.content}
                      </div>
                    )}

                    {/* Time + read receipt */}
                    <div className={cn(
                      'flex items-center gap-1 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity',
                      isOwn ? 'flex-row-reverse' : 'flex-row',
                    )}>
                      <span className="text-[10px] text-muted">{formatMessageTime(msg.createdAt)}</span>
                      {isOwn && !msg.isDeleted && (
                        <span className={cn('text-[10px]', msg.seenBy?.length > 1 ? 'text-brand' : 'text-muted')}>
                          {msg.seenBy?.length > 1 ? <RiCheckDoubleLine size={12} /> : <RiCheckLine size={12} />}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-end gap-2 mt-3"
            >
              <Avatar src={getAvatarUrl(other)} alt="" size={32} />
              <div className="bg-base-2 border border-base rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-base flex-shrink-0 glass">
        <div className="flex items-end gap-2">
          <div className="flex gap-1 flex-shrink-0 pb-1">
            <button className="p-2 rounded-xl text-muted hover:text-brand hover:bg-brand/8 transition-colors">
              <RiEmotionLine size={19} />
            </button>
            <button className="p-2 rounded-xl text-muted hover:text-brand hover:bg-brand/8 transition-colors">
              <RiImageAddLine size={19} />
            </button>
          </div>

          <div className="flex-1 flex items-end bg-base-2 border border-base rounded-2xl px-4 py-2.5 focus-within:border-brand transition-colors">
            <textarea
              ref={textRef}
              value={content}
              onChange={handleChange}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm leading-relaxed placeholder:text-muted outline-none font-sans max-h-36 overflow-y-auto"
            />
          </div>

          <motion.button
            onClick={send}
            disabled={!content.trim() || sending}
            whileTap={{ scale: 0.88 }}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 transition-all',
              content.trim() && !sending
                ? 'shadow-lg shadow-brand/30'
                : 'opacity-40 cursor-not-allowed',
            )}
            style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
          >
            {sending ? <RiLoader4Line size={18} className="animate-spin" /> : <RiSendPlaneFill size={18} />}
          </motion.button>
        </div>
        <p className="text-[10px] text-muted mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
