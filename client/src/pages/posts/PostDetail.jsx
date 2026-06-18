import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiArrowLeftLine, RiHeart3Line, RiHeart3Fill,
  RiChat3Line, RiBookmarkLine, RiBookmarkFill,
  RiShareLine, RiMoreLine, RiDeleteBin6Line, RiLinkM,
  RiSendPlaneFill, RiEyeLine, RiImageLine, RiLoader4Line,
} from 'react-icons/ri';
import { postApi } from '@/services/api';
import { selectUser } from '@/features/auth/authSlice';
import Avatar from '@/components/ui/Avatar';
import PostSkeleton from '@/components/loaders/PostSkeleton';
import { getAvatarUrl, formatCount, timeAgo, parseContent, copyToClipboard, cn } from '@/utils';
import toast from 'react-hot-toast';

/* ── Lightbox ────────────────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white p-2 rounded-full bg-white/10 text-xl leading-none">✕</button>
      <img src={images[idx].url} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl">‹</button>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl">›</button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} className={cn('w-2 h-2 rounded-full transition-all', i === idx ? 'bg-white' : 'bg-white/40')} />)}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ── Single comment ──────────────────────────────────────────── */
function CommentRow({ comment, postId, queryKey, me }) {
  const qc = useQueryClient();
  const [liked,    setLiked]    = useState(false);
  const [likes,    setLikes]    = useState(comment.likesCount || 0);
  const [reply,    setReply]    = useState('');
  const [showReply,setShowReply]= useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sending,  setSending]  = useState(false);

  const isOwner = me?._id === comment.user?._id;
  const isMod   = ['admin','moderator'].includes(me?.role);

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    setDeleting(true);
    try { await postApi.deleteComment(postId, comment._id); qc.invalidateQueries({ queryKey }); toast.success('Comment deleted'); }
    catch { toast.error('Failed'); setDeleting(false); }
  };

  const handleReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      await postApi.addComment(postId, `@${comment.user?.username} ${reply.trim()}`);
      qc.invalidateQueries({ queryKey }); setReply(''); setShowReply(false);
    } catch { toast.error('Failed'); }
    finally { setSending(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16, height: 0 }} className="flex gap-3 group">
      <Link to={`/profile/${comment.user?.username}`} className="flex-shrink-0 mt-0.5">
        <Avatar src={getAvatarUrl(comment.user)} alt={comment.user?.username} size={36} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-base-2 rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-full">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link to={`/profile/${comment.user?.username}`} className="text-sm font-bold hover:text-brand transition-colors">
              {comment.user?.name || comment.user?.username}
            </Link>
            {comment.user?.isVerified && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-brand flex-shrink-0"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            )}
            <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
          </div>
          <div className="text-sm leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: parseContent(comment.content) }} />
        </div>

        {/* action row */}
        <div className="flex items-center gap-3 mt-1.5 ml-1">
          <button onClick={() => { setLiked(!liked); setLikes(c => liked ? c - 1 : c + 1); }}
            className={cn('flex items-center gap-1 text-xs font-semibold transition-colors', liked ? 'text-red-500' : 'text-muted hover:text-red-500')}>
            {liked ? <RiHeart3Fill size={13}/> : <RiHeart3Line size={13}/>}
            {likes > 0 && <span>{likes}</span>}
            Like
          </button>
          <button onClick={() => setShowReply(!showReply)} className="text-xs font-semibold text-muted hover:text-brand transition-colors">Reply</button>
          {(isOwner || isMod) && (
            <button onClick={handleDelete} disabled={deleting}
              className="opacity-0 group-hover:opacity-100 text-xs text-muted hover:text-red-500 transition-all flex items-center gap-1">
              {deleting ? <RiLoader4Line size={12} className="animate-spin"/> : <RiDeleteBin6Line size={12}/>}Delete
            </button>
          )}
        </div>

        {/* reply input */}
        <AnimatePresence>
          {showReply && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 flex gap-2 items-center overflow-hidden">
              <Avatar src={getAvatarUrl(me)} alt={me?.username} size={28} className="flex-shrink-0"/>
              <div className="flex-1 flex items-center gap-2 bg-base-2 border border-base rounded-xl px-3 py-1.5 focus-within:border-brand transition-colors">
                <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key==='Enter' && handleReply()}
                  placeholder={`Reply to @${comment.user?.username}…`} autoFocus
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted"/>
                <button onClick={handleReply} disabled={!reply.trim()||sending} className="text-brand disabled:opacity-30">
                  {sending ? <RiLoader4Line size={14} className="animate-spin"/> : <RiSendPlaneFill size={14}/>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Comment input box ───────────────────────────────────────── */
function CommentInput({ postId, queryKey, me }) {
  const qc = useQueryClient();
  const [content,  setContent]  = useState('');
  const [sending,  setSending]  = useState(false);

  const submit = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try { await postApi.addComment(postId, content.trim()); setContent(''); qc.invalidateQueries({ queryKey }); }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed to post'); }
    finally { setSending(false); }
  };

  return (
    <div className="flex gap-3 items-start">
      <Avatar src={getAvatarUrl(me)} alt={me?.username} size={40} className="flex-shrink-0"/>
      <div className="flex-1">
        <div className="flex items-end gap-2 bg-base-2 border border-base rounded-2xl px-4 py-3 focus-within:border-brand transition-colors">
          <textarea value={content}
            onChange={e => { setContent(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'; }}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();} }}
            placeholder="Write a comment… (Enter to post)"
            rows={1} maxLength={1000}
            className="flex-1 bg-transparent text-sm placeholder:text-muted outline-none resize-none font-sans leading-relaxed max-h-32 overflow-y-auto"/>
          <button onClick={submit} disabled={!content.trim()||sending} className="text-brand disabled:opacity-30 hover:scale-110 transition-transform flex-shrink-0 pb-0.5">
            {sending ? <RiLoader4Line size={20} className="animate-spin"/> : <RiSendPlaneFill size={20}/>}
          </button>
        </div>
        <p className="text-[11px] text-muted mt-1 ml-1">{content.length}/1000 · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function PostDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const me       = useSelector(selectUser);

  const [liked,     setLiked]    = useState(null);
  const [likeCount, setLikeCount]= useState(null);
  const [saved,     setSaved]    = useState(null);
  const [menuOpen,  setMenuOpen] = useState(false);
  const [lightbox,  setLightbox] = useState(null);

  const queryKey = ['post', id];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => postApi.getPost(id).then(r => r.data.data),
    onSuccess: d => {
      if (liked    === null) setLiked(d.isLiked ?? false);
      if (likeCount=== null) setLikeCount(d.likesCount ?? 0);
      if (saved    === null) setSaved(d.isSaved ?? false);
    },
  });

  const isLiked  = liked     ?? data?.isLiked     ?? false;
  const numLikes = likeCount ?? data?.likesCount  ?? 0;
  const isSaved  = saved     ?? data?.isSaved     ?? false;
  const isOwn    = me?._id === data?.author?._id;

  const handleLike = async () => {
    const was = isLiked; setLiked(!was); setLikeCount(c => was ? c-1 : c+1);
    try { await postApi.like(id); } catch { setLiked(was); setLikeCount(c => was ? c+1 : c-1); }
  };

  const handleSave = async () => {
    const was = isSaved; setSaved(!was);
    try { await postApi.save(id); toast.success(was ? 'Removed from saved' : '✓ Saved'); } catch { setSaved(was); }
  };

  const handleShare = async () => {
    if (await copyToClipboard(`${window.location.origin}/posts/${id}`)) toast.success('Link copied!');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post permanently?')) return;
    try { await postApi.delete(id); toast.success('Post deleted'); navigate(-1); } catch { toast.error('Failed to delete'); }
  };

  /* ── Loading ── */
  if (isLoading) return (
    <div className="space-y-4">
      <div className="skeleton h-9 w-24 rounded-xl"/>
      <PostSkeleton count={1}/>
      <div className="card p-5 space-y-5">
        {[...Array(3)].map((_,i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="skeleton w-10 h-10 rounded-full flex-shrink-0"/>
            <div className="skeleton flex-1 h-16 rounded-2xl rounded-tl-sm"/>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Not found ── */
  if (isError || !data) return (
    <div className="card p-12 text-center">
      <RiImageLine size={40} className="mx-auto mb-3 text-muted opacity-30"/>
      <p className="font-semibold text-secondary mb-1">Post not found</p>
      <p className="text-sm text-muted mb-5">This post may have been deleted or made private.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary btn">Go back</button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{`${data.author?.name || data.author?.username} on Nexus`}</title>
        <meta name="description" content={data.content?.slice(0,160)}/>
      </Helmet>

      {/* lightbox */}
      <AnimatePresence>
        {lightbox !== null && <Lightbox images={data.images} startIndex={lightbox} onClose={() => setLightbox(null)}/>}
      </AnimatePresence>

      {/* back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-secondary hover:text-primary mb-5 transition-colors group">
        <span className="p-1.5 rounded-lg group-hover:bg-base-3 transition-colors"><RiArrowLeftLine size={18}/></span>Back
      </button>

      {/* ── Post card ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mb-4 overflow-hidden">

        {/* author */}
        <div className="flex items-center justify-between p-5 pb-4">
          <Link to={`/profile/${data.author?.username}`} className="flex items-center gap-3 group">
            <Avatar src={getAvatarUrl(data.author)} alt={data.author?.username} size={48} online={data.author?.onlineStatus==='online'}/>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base group-hover:text-brand transition-colors">{data.author?.name||data.author?.username}</span>
                {data.author?.isVerified && <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-brand"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
              </div>
              <p className="text-sm text-muted">@{data.author?.username} · {timeAgo(data.createdAt)}</p>
            </div>
          </Link>

          {/* menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-xl text-muted hover:bg-base-3 transition-colors">
              <RiMoreLine size={20}/>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity:0,scale:.95,y:-6 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:.95 }}
                  className="absolute right-0 mt-1 w-48 bg-base border border-base rounded-2xl shadow-xl z-20 overflow-hidden"
                  onMouseLeave={() => setMenuOpen(false)}>
                  <button onClick={() => { setMenuOpen(false); handleShare(); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-base-3 text-primary"><RiLinkM size={15}/>Copy link</button>
                  {isOwn && <button onClick={() => { setMenuOpen(false); handleDelete(); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><RiDeleteBin6Line size={15}/>Delete post</button>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* content */}
        <div className="px-5 pb-4">
          <div className="text-base leading-relaxed whitespace-pre-wrap break-words text-primary"
            dangerouslySetInnerHTML={{ __html: parseContent(data.content) }}/>
        </div>

        {/* images */}
        {data.images?.length > 0 && (
          <div className={cn('mx-5 mb-4 rounded-2xl overflow-hidden cursor-pointer', data.images.length>1?'grid grid-cols-2 gap-1':'')}>
            {data.images.slice(0,4).map((img,i) => (
              <div key={i} className={cn('relative overflow-hidden bg-base-3', data.images.length===1?'max-h-[520px]':'h-52')} onClick={() => setLightbox(i)}>
                <img src={img.url} alt={img.alt||''} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"/>
                {i===3 && data.images.length>4 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-2xl">+{data.images.length-4}</div>}
              </div>
            ))}
          </div>
        )}

        {/* tags */}
        {data.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 mb-4">
            {data.tags.map(t => <Link key={t} to={`/explore?tag=${t}`} className="text-xs font-bold text-brand bg-brand/8 hover:bg-brand/15 px-3 py-1 rounded-full transition-colors">#{t}</Link>)}
          </div>
        )}

        {/* stats */}
        <div className="flex items-center gap-5 px-5 py-3 border-t border-base text-sm text-muted">
          <span><strong className="text-primary">{formatCount(data.commentsCount)}</strong> comments</span>
          <span><strong className="text-primary">{formatCount(numLikes)}</strong> likes</span>
          {data.viewsCount > 0 && <span className="flex items-center gap-1 ml-auto"><RiEyeLine size={14}/>{formatCount(data.viewsCount)}</span>}
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-1 px-3 py-2 border-t border-base">
          {[
            { onClick: handleLike,  icon: isLiked ? <RiHeart3Fill size={19}/> : <RiHeart3Line size={19}/>,  label: isLiked ? formatCount(numLikes) : 'Like',    active: isLiked,  activeClass: 'text-red-500 bg-red-50 dark:bg-red-900/15',   hoverClass: 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15'    },
            { onClick: () => document.getElementById('cmt-input')?.focus(), icon: <RiChat3Line size={19}/>, label: 'Comment', active: false, activeClass: '', hoverClass: 'hover:text-brand hover:bg-brand/8' },
            { onClick: handleShare, icon: <RiShareLine size={19}/>,  label: 'Share',   active: false, activeClass: '',                              hoverClass: 'hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/15' },
            { onClick: handleSave,  icon: isSaved ? <RiBookmarkFill size={19}/> : <RiBookmarkLine size={19}/>, label: isSaved ? 'Saved' : 'Save', active: isSaved, activeClass: 'text-brand bg-brand/8', hoverClass: 'hover:text-brand hover:bg-brand/8' },
          ].map((btn, i) => (
            <motion.button key={i} onClick={btn.onClick} whileTap={{ scale: 0.9 }}
              className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all text-muted', btn.active ? btn.activeClass : btn.hoverClass)}>
              {btn.icon}{btn.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Comments ── */}
      <div className="card p-5">
        <h3 className="font-bold text-base mb-5 flex items-center gap-2">
          <RiChat3Line size={18} className="text-brand"/>
          Comments
          <span className="text-sm font-normal text-muted">({formatCount(data.commentsCount)})</span>
        </h3>

        {me && <div className="mb-6" id="cmt-input"><CommentInput postId={id} queryKey={queryKey} me={me}/></div>}

        <div className="space-y-5">
          <AnimatePresence>
            {(data.comments||[]).length === 0 && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center py-10">
                <RiChat3Line size={36} className="mx-auto mb-3 text-muted opacity-25"/>
                <p className="text-secondary font-semibold">No comments yet</p>
                <p className="text-sm text-muted mt-1">Be the first to share your thoughts!</p>
              </motion.div>
            )}
            {(data.comments||[]).map(c => (
              <CommentRow key={c._id} comment={c} postId={id} queryKey={queryKey} me={me}/>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
