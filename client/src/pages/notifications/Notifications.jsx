import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiBellLine, RiHeart3Fill, RiChat3Fill, RiUserFollowFill,
  RiAtLine, RiRepeatFill, RiDeleteBin6Line, RiCheckDoubleLine,
  RiLoader4Line,
} from 'react-icons/ri';
import { notificationApi, userApi } from '@/services/api';
import {
  selectNotifications, setNotifications, markAllRead,
  setUnreadCount, removeNotification,
} from '@/features/notifications/notificationSlice';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { getAvatarUrl, timeAgo, cn, isDateToday } from '@/utils';
import toast from 'react-hot-toast';

/* ── Metadata per notification type ──────────────────────────── */
const META = {
  like:           { Icon: RiHeart3Fill,     color: 'text-rose-500',   bg: 'bg-rose-100 dark:bg-rose-900/30',      verb: 'liked your post'         },
  comment:        { Icon: RiChat3Fill,      color: 'text-nexus',      bg: 'bg-nexus/10',                           verb: 'commented on your post'  },
  follow:         { Icon: RiUserFollowFill, color: 'text-emerald-500',bg: 'bg-emerald-100 dark:bg-emerald-900/30', verb: 'started following you'   },
  follow_request: { Icon: RiUserFollowFill, color: 'text-amber-500',  bg: 'bg-amber-100 dark:bg-amber-900/30',    verb: 'requested to follow you' },
  mention:        { Icon: RiAtLine,         color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30',  verb: 'mentioned you'           },
  repost:         { Icon: RiRepeatFill,     color: 'text-cyan-500',   bg: 'bg-cyan-100 dark:bg-cyan-900/30',      verb: 'reposted your post'      },
  reply:          { Icon: RiChat3Fill,      color: 'text-blue-500',   bg: 'bg-blue-100 dark:bg-blue-900/30',      verb: 'replied to your comment' },
  comment_like:   { Icon: RiHeart3Fill,     color: 'text-pink-400',   bg: 'bg-pink-100 dark:bg-pink-900/20',      verb: 'liked your comment'      },
  default:        { Icon: RiBellLine,       color: 'text-muted',      bg: 'bg-base-3',                            verb: 'sent a notification'     },
};

/* ── Filter tab definitions ──────────────────────────────────── */
const TABS = [
  { id: 'all',      label: 'All'      },
  { id: 'likes',    label: 'Likes'    },
  { id: 'comments', label: 'Comments' },
  { id: 'follows',  label: 'Follows'  },
  { id: 'mentions', label: 'Mentions' },
];

/* Maps a tab id to which notification types match */
const tabMatch = (n, id) => {
  if (id === 'all')      return true;
  if (id === 'likes')    return ['like', 'comment_like'].includes(n.type);
  if (id === 'comments') return ['comment', 'reply'].includes(n.type);
  if (id === 'follows')  return ['follow', 'follow_request'].includes(n.type);
  if (id === 'mentions') return n.type === 'mention';
  return true;
};

/* ── Follow-back button ──────────────────────────────────────── */
function FollowBack({ userId }) {
  const [st, setSt] = useState('idle');
  if (st === 'done') return <span className="text-xs text-emerald-600 font-bold flex-shrink-0">Following ✓</span>;
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        setSt('loading');
        try { await userApi.follow(userId); setSt('done'); toast.success('Following back!'); }
        catch { setSt('idle'); }
      }}
      disabled={st === 'loading'}
      className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-nexus/10 text-nexus hover:bg-nexus hover:text-white transition-all disabled:opacity-50 flex items-center gap-1"
    >
      {st === 'loading' && <RiLoader4Line size={11} className="animate-spin" />}
      Follow back
    </button>
  );
}

/* ── Single notification row ─────────────────────────────────── */
function NotifRow({ n, onDelete, onRead }) {
  const navigate = useNavigate();
  const m = META[n.type] || META.default;

  const dest = ['follow', 'follow_request'].includes(n.type)
    ? `/profile/${n.sender?.username}`
    : (n.entityId?._id || (typeof n.entityId === 'string' ? n.entityId : null))
      ? `/posts/${n.entityId?._id || n.entityId}`
      : null;

  const handleClick = () => {
    if (!n.isRead) onRead(n._id);
    if (dest) navigate(dest);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, paddingTop: 0, paddingBottom: 0 }}
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 px-4 py-4 group transition-colors relative',
        dest ? 'cursor-pointer hover:bg-base-2' : '',
        !n.isRead ? 'bg-nexus/[0.03]' : '',
      )}
    >
      {/* Unread dot */}
      {!n.isRead && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-nexus flex-shrink-0" />
      )}

      {/* Avatar + type icon */}
      <div
        className="relative flex-shrink-0 cursor-pointer"
        onClick={e => { e.stopPropagation(); navigate(`/profile/${n.sender?.username}`); }}
      >
        <Avatar src={getAvatarUrl(n.sender)} alt={n.sender?.username || '?'} size={46} />
        <span className={cn('absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900', m.bg)}>
          <m.Icon size={11} className={m.color} />
        </span>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span
            className="font-bold hover:text-nexus transition-colors cursor-pointer mr-1"
            onClick={e => { e.stopPropagation(); navigate(`/profile/${n.sender?.username}`); }}
          >
            {n.sender?.name || n.sender?.username || 'Someone'}
          </span>
          <span className="text-secondary font-normal">{m.verb}</span>
          {n.extras?.length > 0 && (
            <span className="text-muted font-normal"> and {n.extras.length} other{n.extras.length > 1 ? 's' : ''}</span>
          )}
        </p>
        <p className="text-xs text-muted mt-0.5 font-medium">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Post thumbnail */}
      {n.entityId?.images?.[0]?.url && (
        <img src={n.entityId.images[0].url} alt="" className="w-12 h-12 rounded-xl object-cover border border-base flex-shrink-0" onClick={e => e.stopPropagation()} />
      )}

      {/* Follow back */}
      {n.type === 'follow' && n.sender?._id && (
        <div onClick={e => e.stopPropagation()}><FollowBack userId={n.sender._id} /></div>
      )}

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(n._id); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-muted hover:text-red-500 transition-all flex-shrink-0"
      >
        <RiDeleteBin6Line size={15} />
      </button>
    </motion.div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function Notifications() {
  const dispatch  = useDispatch();
  const qc        = useQueryClient();
  const items     = useSelector(selectNotifications);
  const [tab, setTab] = useState('all');

  useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationApi.getAll({ limit: 60 }).then(r => r.data),
    onSuccess: ({ data, unreadCount }) => {
      dispatch(setNotifications(data));
      dispatch(setUnreadCount(unreadCount));
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const handleMarkAll = async () => {
    dispatch(markAllRead());
    await notificationApi.markAllRead().catch(() => {});
    toast.success('All marked as read');
  };

  const handleDelete = async (id) => {
    dispatch(removeNotification(id));
    await notificationApi.delete(id).catch(() => {});
  };

  const handleReadOne = async (id) => {
    await notificationApi.markRead([id]).catch(() => {});
  };

  const totalUnread  = items.filter(n => !n.isRead).length;
  const filtered     = items.filter(n => tabMatch(n, tab));
  const today        = filtered.filter(n => isDateToday(n.createdAt));
  const earlier      = filtered.filter(n => !isDateToday(n.createdAt));
  const tabBadge     = (id) => items.filter(n => !n.isRead && tabMatch(n, id)).length;

  return (
    <>
      <Helmet><title>Notifications · Nexus</title></Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-display font-bold">Notifications</h1>
          {totalUnread > 0 && (
            <p className="text-sm text-muted mt-0.5">
              <span className="text-nexus font-semibold">{totalUnread}</span> unread
            </p>
          )}
        </div>
        {totalUnread > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAll}>
            <RiCheckDoubleLine size={15} /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs — always show correct label text */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {TABS.map(({ id, label }) => {
          const isActive = tab === id;
          const badge    = tabBadge(id);
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                isActive
                  ? 'bg-gradient-nexus text-white shadow-glow-sm'
                  : 'bg-base-2 border border-base text-secondary hover:text-primary hover:border-nexus/30',
              )}
            >
              {/* Label text is ALWAYS visible — never hidden */}
              <span>{label}</span>
              {badge > 0 && (
                <span className={cn('text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1', isActive ? 'bg-white/25 text-white' : 'bg-nexus text-white')}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-base-3 flex items-center justify-center mx-auto mb-4">
            <RiBellLine size={28} className="text-muted opacity-40" />
          </div>
          <p className="font-semibold text-secondary">
            {tab === 'all' ? 'No notifications yet' : `No ${TABS.find(t => t.id === tab)?.label.toLowerCase()} notifications`}
          </p>
          <p className="text-sm text-muted mt-1">
            {tab === 'all' ? "Activity from your followers will show here." : 'Check back later.'}
          </p>
        </motion.div>
      )}

      {/* Today group */}
      {today.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-muted uppercase tracking-wider px-1 mb-2">Today</p>
          <div className="card overflow-hidden divide-y divide-base">
            <AnimatePresence initial={false}>
              {today.map(n => <NotifRow key={n._id} n={n} onDelete={handleDelete} onRead={handleReadOne} />)}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Earlier group */}
      {earlier.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider px-1 mb-2">Earlier</p>
          <div className="card overflow-hidden divide-y divide-base">
            <AnimatePresence initial={false}>
              {earlier.map(n => <NotifRow key={n._id} n={n} onDelete={handleDelete} onRead={handleReadOne} />)}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}
