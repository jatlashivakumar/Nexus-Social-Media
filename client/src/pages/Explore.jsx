import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiSearchLine, RiHashtag, RiFireLine, RiUserLine,
  RiCloseLine, RiBarChartLine, RiGlobalLine,
} from 'react-icons/ri';
import { postApi, userApi } from '@/services/api';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useDebounce } from '@/hooks/useDebounce';
import PostCard from '@/components/common/PostCard';
import UserCard from '@/components/common/UserCard';
import PostSkeleton from '@/components/loaders/PostSkeleton';
import UserSkeleton from '@/components/loaders/UserSkeleton';
import { cn } from '@/utils';

const TABS = [
  { id: 'trending', label: 'Trending', Icon: RiFireLine },
  { id: 'latest',   label: 'Latest',   Icon: RiGlobalLine },
  { id: 'people',   label: 'People',   Icon: RiUserLine },
  { id: 'tags',     label: 'Tags',     Icon: RiHashtag },
];

const TRENDING_TAGS = [
  { tag: 'webdev',        count: '12.4K' },
  { tag: 'reactjs',       count: '9.8K'  },
  { tag: 'nodejs',        count: '8.2K'  },
  { tag: 'javascript',    count: '21K'   },
  { tag: 'typescript',    count: '7.5K'  },
  { tag: 'css',           count: '6.1K'  },
  { tag: 'design',        count: '14K'   },
  { tag: 'ai',            count: '31K'   },
  { tag: 'opensource',    count: '5.3K'  },
  { tag: 'python',        count: '18K'   },
  { tag: 'career',        count: '9.1K'  },
  { tag: 'productivity',  count: '4.7K'  },
  { tag: 'devops',        count: '3.9K'  },
  { tag: 'ux',            count: '6.6K'  },
  { tag: 'startup',       count: '8.8K'  },
];

export default function Explore() {
  const [sp, setSp] = useSearchParams();
  const [tab,   setTab]   = useState('trending');
  const [query, setQuery] = useState(sp.get('q') || '');
  const tag = sp.get('tag') || '';
  const dq  = useDebounce(query, 400);

  // switch to search results when typing
  const activeTab = dq ? (tab === 'people' ? 'people' : 'trending') : tab;

  // ── Trending / latest posts ────────────────────────────────
  const { items: posts, isLoading: postsLoading, loaderRef } = useInfiniteScroll({
    queryKey: ['explore', tag, dq, activeTab],
    queryFn: ({ page, limit }) =>
      postApi.getExplore({
        page, limit,
        ...(tag         ? { tag }  : {}),
        ...(dq          ? { q: dq }: {}),
        ...(activeTab === 'latest' ? { sort: '-createdAt' } : {}),
      }).then(r => r.data),
    enabled: activeTab === 'trending' || activeTab === 'latest',
  });

  // ── People search ──────────────────────────────────────────
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['exploreUsers', dq],
    queryFn:  () => userApi.search(dq || '', { limit: 24 }).then(r => r.data.data),
    enabled:  activeTab === 'people',
  });

  const clearTag = () => setSp({});

  return (
    <>
      <Helmet><title>Explore · Nexus</title></Helmet>

      {/* ── Search bar ── */}
      <div className="relative mb-5">
        <RiSearchLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) setSp({}); }}
          placeholder="Search posts, people, tags…"
          className="input-base pl-10 pr-10 py-3 text-base"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
            <RiCloseLine size={18} />
          </button>
        )}
      </div>

      {/* ── Active tag chip ── */}
      <AnimatePresence>
        {tag && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 text-brand rounded-full text-sm font-semibold">
              <RiHashtag size={14} />#{tag}
            </span>
            <button onClick={clearTag} className="text-xs text-muted hover:text-red-500 transition-colors">✕ Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-base-2 border border-base rounded-xl mb-5">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-sm font-medium transition-all',
              (dq ? (id === 'people' ? tab === 'people' : id === 'trending') : tab === id)
                ? 'bg-base text-primary shadow-sm'
                : 'text-muted hover:text-primary',
            )}
          >
            <Icon size={15} /><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Trending / Latest posts ── */}
      {(activeTab === 'trending' || activeTab === 'latest') && (
        <div className="space-y-4">
          {postsLoading && <PostSkeleton count={4} />}
          {!postsLoading && posts.length === 0 && (
            <div className="card p-12 text-center">
              <RiFireLine size={40} className="mx-auto mb-3 text-muted opacity-30" />
              <p className="font-medium text-secondary">No posts found</p>
              {tag && <p className="text-sm text-muted mt-1">Try a different tag</p>}
            </div>
          )}
          {posts.map(p => <PostCard key={p._id} post={p} queryKey={['explore', tag, dq]} />)}
          <div ref={loaderRef} className="py-2" />
        </div>
      )}

      {/* ── People tab ── */}
      {activeTab === 'people' && (
        <div className="space-y-4">
          {usersLoading && (
            <div className="card"><UserSkeleton count={8} /></div>
          )}
          {!usersLoading && users?.length === 0 && (
            <div className="card p-12 text-center">
              <RiUserLine size={40} className="mx-auto mb-3 text-muted opacity-30" />
              <p className="font-medium text-secondary">No users found</p>
              {dq && <p className="text-sm text-muted mt-1">Try a different search</p>}
            </div>
          )}
          {!usersLoading && users?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {users.map(u => (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card hover:shadow-md transition-shadow"
                >
                  <UserCard user={u} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tags tab ── */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <RiBarChartLine size={18} className="text-brand" />
              <h3 className="font-semibold">Trending Tags</h3>
            </div>
            <div className="space-y-1">
              {TRENDING_TAGS.map((item, i) => (
                <motion.button
                  key={item.tag}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { setSp({ tag: item.tag }); setTab('trending'); }}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-base-3 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-brand transition-colors">#{item.tag}</p>
                      <p className="text-xs text-muted">{item.count} posts</p>
                    </div>
                  </div>
                  <RiBarChartLine size={16} className="text-muted group-hover:text-brand transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
