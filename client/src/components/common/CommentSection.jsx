import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RiSendPlaneFill, RiDeleteBin6Line } from 'react-icons/ri';
import { useQueryClient } from '@tanstack/react-query';
import { selectUser } from '@/features/auth/authSlice';
import { postApi } from '@/services/api';
import Avatar from '@/components/ui/Avatar';
import { timeAgo, getAvatarUrl } from '@/utils';
import toast from 'react-hot-toast';

export default function CommentSection({ postId, comments = [], queryKey }) {
  const me = useSelector(selectUser);
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [submitting, setSub] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSub(true);
    try { await postApi.addComment(postId, content.trim()); setContent(''); if (queryKey) qc.invalidateQueries({ queryKey }); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSub(false); }
  };

  const handleDelete = async (cid) => {
    try { await postApi.deleteComment(postId, cid); if (queryKey) qc.invalidateQueries({ queryKey }); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-5">
        <Avatar src={getAvatarUrl(me)} alt={me?.username} size={36} className="flex-shrink-0"/>
        <div className="flex-1 flex items-center gap-2 bg-base-2 border border-base rounded-xl px-3 py-2 focus-within:border-brand transition-colors">
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="Write a comment…" maxLength={1000} className="flex-1 bg-transparent text-sm placeholder:text-muted outline-none"/>
          <button type="submit" disabled={!content.trim()||submitting} className="text-brand disabled:opacity-30"><RiSendPlaneFill size={18}/></button>
        </div>
      </form>
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map(c => (
            <motion.div key={c._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-20}} className="flex gap-3 group">
              <Link to={`/profile/${c.user?.username}`} className="flex-shrink-0"><Avatar src={getAvatarUrl(c.user)} alt={c.user?.username} size={34}/></Link>
              <div className="flex-1 min-w-0">
                <div className="bg-base-2 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/profile/${c.user?.username}`} className="text-xs font-semibold hover:text-brand">{c.user?.name||c.user?.username}</Link>
                    <span className="text-[11px] text-muted">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{c.content}</p>
                </div>
                {me && (me._id === c.user?._id || me.role === 'admin') && (
                  <button onClick={() => handleDelete(c._id)} className="mt-1 ml-1 text-[11px] text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><RiDeleteBin6Line size={13}/></button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {comments.length === 0 && <p className="text-center text-sm text-muted py-4">No comments yet. Be the first!</p>}
      </div>
    </div>
  );
}
