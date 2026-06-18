import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { RiHeart3Line,RiHeart3Fill,RiChat3Line,RiBookmarkLine,RiBookmarkFill,RiShareLine,RiMoreLine,RiDeleteBin6Line,RiLinkM,RiEyeLine } from 'react-icons/ri';
import { postApi } from '@/services/api';
import { selectUser } from '@/features/auth/authSlice';
import Avatar from '@/components/ui/Avatar';
import { cn, timeAgo, formatCount, parseContent, getAvatarUrl, copyToClipboard } from '@/utils';
import toast from 'react-hot-toast';

export default function PostCard({ post, queryKey }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useSelector(selectUser);
  const [liked,      setLiked]      = useState(post.isLiked);
  const [likes,      setLikes]      = useState(post.likesCount || 0);
  const [saved,      setSaved]      = useState(post.isSaved);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const isOwn = me?._id === post.author?._id;

  const handleLike = async () => {
    const was = liked; setLiked(!was); setLikes(c => was ? c-1 : c+1);
    try { await postApi.like(post._id); } catch { setLiked(was); setLikes(c => was ? c+1 : c-1); }
  };
  const handleSave = async () => {
    const was = saved; setSaved(!was);
    try { await postApi.save(post._id); toast.success(was ? 'Unsaved' : 'Saved!'); } catch { setSaved(was); }
  };
  const handleShare = async () => { if (await copyToClipboard(`${window.location.origin}/posts/${post._id}`)) toast.success('Link copied!'); };
  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try { await postApi.delete(post._id); if (queryKey) qc.invalidateQueries({ queryKey }); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  return (
    <motion.article initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.3}} className="card p-5 group">
      <div className="flex items-start justify-between mb-3">
        <Link to={`/profile/${post.author?.username}`} className="flex items-center gap-3 min-w-0">
          <Avatar src={getAvatarUrl(post.author)} alt={post.author?.username} size={40} online={post.author?.onlineStatus==='online'}/>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate hover:text-brand transition-colors">{post.author?.name||post.author?.username}</span>
              {post.author?.isVerified && <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-brand flex-shrink-0"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            </div>
            <p className="text-xs text-muted">@{post.author?.username} · {timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg text-muted hover:bg-base-3 transition-all opacity-0 group-hover:opacity-100"><RiMoreLine size={18}/></button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-base border border-base rounded-xl shadow-xl z-10 overflow-hidden">
              {isOwn && <button onClick={() => { setMenuOpen(false); handleDelete(); }} className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><RiDeleteBin6Line size={15}/>Delete</button>}
              <button onClick={() => { setMenuOpen(false); handleShare(); }} className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm text-primary hover:bg-base-3"><RiLinkM size={15}/>Copy link</button>
              <button onClick={() => { setMenuOpen(false); navigate(`/posts/${post._id}`); }} className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm text-primary hover:bg-base-3"><RiEyeLine size={15}/>View post</button>
            </div>
          )}
        </div>
      </div>

      <div className="text-sm leading-relaxed mb-4 cursor-pointer" onClick={() => navigate(`/posts/${post._id}`)}
        dangerouslySetInnerHTML={{ __html: parseContent(post.content) }}/>

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(t => <Link key={t} to={`/explore?tag=${t}`} className="text-xs font-medium text-brand bg-brand/8 hover:bg-brand/15 px-2.5 py-1 rounded-full transition-colors">#{t}</Link>)}
        </div>
      )}

      {post.images?.length > 0 && (
        <div className={cn('rounded-xl overflow-hidden mb-4 cursor-pointer', post.images.length > 1 ? 'grid grid-cols-2 gap-1' : '')} onClick={() => navigate(`/posts/${post._id}`)}>
          {post.images.slice(0,4).map((img, i) => (
            <div key={i} className={cn('relative overflow-hidden bg-base-3', post.images.length===1 ? 'max-h-80' : 'h-44')}>
              <img src={img.url} alt={img.alt||''} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
              {i===3 && post.images.length>4 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-2xl">+{post.images.length-4}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 pt-2 border-t border-base -mx-1">
        <button onClick={handleLike} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all', liked ? 'text-red-500 bg-red-50 dark:bg-red-900/15' : 'text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15')}>
          <motion.span animate={liked ? {scale:[1,1.3,1]} : {}} transition={{duration:.2}}>{liked ? <RiHeart3Fill size={18}/> : <RiHeart3Line size={18}/>}</motion.span>{formatCount(likes)}
        </button>
        <button onClick={() => navigate(`/posts/${post._id}`)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-brand hover:bg-brand/8 transition-all">
          <RiChat3Line size={18}/>{formatCount(post.commentsCount)}
        </button>
        <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/15 transition-all"><RiShareLine size={18}/></button>
        <button onClick={handleSave} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ml-auto', saved ? 'text-brand bg-brand/8' : 'text-muted hover:text-brand hover:bg-brand/8')}>
          {saved ? <RiBookmarkFill size={18}/> : <RiBookmarkLine size={18}/>}
        </button>
      </div>
    </motion.article>
  );
}
