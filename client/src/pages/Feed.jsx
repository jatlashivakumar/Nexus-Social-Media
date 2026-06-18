import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiAddCircleLine, RiRefreshLine, RiHashtag,
  RiFireLine, RiArrowRightLine,
} from 'react-icons/ri';
import { openModal } from '@/features/ui/uiSlice';
import { selectUser } from '@/features/auth/authSlice';
import { postApi, userApi } from '@/services/api';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import PostCard from '@/components/common/PostCard';
import PostSkeleton from '@/components/loaders/PostSkeleton';
import UserCard from '@/components/common/UserCard';
import Avatar from '@/components/ui/Avatar';
import { getAvatarUrl } from '@/utils';

const TRENDING_TAGS = [
  { tag: 'webdev',     posts: '12.4K' },
  { tag: 'reactjs',   posts: '9.8K'  },
  { tag: 'javascript',posts: '21K'   },
  { tag: 'ai',        posts: '31K'   },
  { tag: 'design',    posts: '14K'   },
  { tag: 'career',    posts: '9.1K'  },
];

export default function Feed() {
  const dispatch    = useDispatch();
  const qc          = useQueryClient();
  const me          = useSelector(selectUser);
  const [refreshing, setRefreshing] = useState(false);

  const { items: posts, isLoading, isError, loaderRef } = useInfiniteScroll({
    queryKey: ['feed'],
    queryFn: ({ page, limit }) => postApi.getFeed({ page, limit }).then(r => r.data),
  });

  const { data: suggested } = useQuery({
    queryKey:  ['suggested'],
    queryFn:   () => userApi.getSuggested().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['feed'] });
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <>
      <Helmet><title>Feed · Nexus</title></Helmet>

      <div className="flex gap-6 items-start">

        {/* ── Main feed ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Create post prompt */}
          <motion.button
            onClick={() => dispatch(openModal({ type: 'CREATE_POST' }))}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.998 }}
            className="card p-4 w-full flex items-center gap-3 hover:shadow-md transition-all text-left group"
          >
            <Avatar src={getAvatarUrl(me)} alt={me?.username} size={42} className="flex-shrink-0" />
            <span className="flex-1 text-sm text-muted group-hover:text-secondary transition-colors">
              What's on your mind, {me?.name?.split(' ')[0] || me?.username}?
            </span>
            <span className="btn-primary btn text-xs px-3 py-1.5 pointer-events-none flex-shrink-0">
              <RiAddCircleLine size={15} /> Post
            </span>
          </motion.button>

          {/* Refresh bar */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-secondary">Your Feed</p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-brand transition-colors"
            >
              <RiRefreshLine size={15} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Loading */}
          {isLoading && <PostSkeleton count={4} />}

          {/* Error */}
          {isError && (
            <div className="card p-8 text-center">
              <p className="text-secondary mb-3">Could not load feed.</p>
              <button onClick={handleRefresh} className="btn-secondary btn gap-2">
                <RiRefreshLine size={15} /> Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && posts.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">✨</p>
              <p className="font-semibold text-lg mb-1">Your feed is empty</p>
              <p className="text-secondary text-sm mb-5">Follow people to see their posts here.</p>
              <Link to="/explore" className="btn-primary btn">Explore</Link>
            </div>
          )}

          {/* Posts */}
          <AnimatePresence>
            {posts.map((post, i) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i < 4 ? i * 0.06 : 0 }}
              >
                <PostCard post={post} queryKey={['feed']} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="py-4 flex justify-center">
            <div className="w-5 h-5 border-2 border-brand/20 border-t-brand rounded-full animate-spin opacity-0" />
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="w-72 hidden xl:flex flex-col gap-4 flex-shrink-0 sticky top-6">

          {/* Trending tags */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <RiFireLine size={15} className="text-brand" /> Trending
              </h3>
              <Link to="/explore?tab=tags" className="text-xs text-brand hover:underline font-medium">
                See all
              </Link>
            </div>
            <div className="space-y-0.5">
              {TRENDING_TAGS.map(({ tag, posts: count }) => (
                <Link
                  key={tag}
                  to={`/explore?tag=${tag}`}
                  className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-base-3 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                      <RiHashtag size={13} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-brand transition-colors">#{tag}</p>
                      <p className="text-xs text-muted">{count} posts</p>
                    </div>
                  </div>
                  <RiArrowRightLine size={14} className="text-muted group-hover:text-brand transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Suggested users */}
          {suggested?.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Who to follow</h3>
                <Link to="/explore?tab=people" className="text-xs text-brand hover:underline font-medium">
                  See all
                </Link>
              </div>
              <div className="space-y-1">
                {suggested.slice(0, 5).map(u => (
                  <UserCard key={u._id} user={u} />
                ))}
              </div>
            </div>
          )}

          {/* Footer links */}
          <p className="text-[11px] text-muted px-2 leading-relaxed">
            © {new Date().getFullYear()} Nexus ·{' '}
            <Link to="/settings" className="hover:text-brand transition-colors">Settings</Link>
          </p>
        </aside>
      </div>
    </>
  );
}

