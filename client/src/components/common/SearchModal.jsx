import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RiSearchLine, RiCloseLine } from 'react-icons/ri';
import { selectSearchOpen, setSearchOpen, selectModal, closeModal } from '@/features/ui/uiSlice';
import { userApi } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import Avatar from '@/components/ui/Avatar';
import CreatePostModal from './CreatePostModal';
import { getAvatarUrl } from '@/utils';

export default function SearchModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen   = useSelector(selectSearchOpen);
  const modal    = useSelector(selectModal);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const dq = useDebounce(query, 350);

  useEffect(() => {
    const fn = (e) => { if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); dispatch(setSearchOpen(true)); } };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [dispatch]);

  useEffect(() => {
    if (!dq.trim()) { setResults([]); return; }
    setLoading(true);
    userApi.search(dq, { limit: 6 }).then(r => setResults(r.data.data)).catch(() => setResults([])).finally(() => setLoading(false));
  }, [dq]);

  const go = (username) => { dispatch(setSearchOpen(false)); setQuery(''); navigate(`/profile/${username}`); };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { dispatch(setSearchOpen(false)); setQuery(''); }}/>
            <motion.div initial={{opacity:0,y:-20,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-20,scale:.97}} transition={{type:'spring',damping:30,stiffness:400}} className="relative z-10 w-full max-w-xl bg-base border border-base rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-base">
                <RiSearchLine size={20} className="text-muted flex-shrink-0"/>
                <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search users, posts, tags…" className="flex-1 bg-transparent text-primary placeholder:text-muted outline-none text-base"/>
                {query && <button onClick={() => setQuery('')} className="text-muted hover:text-primary"><RiCloseLine size={18}/></button>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading && <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin"/></div>}
                {!loading && results.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs text-muted font-medium px-3 py-1.5">Users</p>
                    {results.map(u => (
                      <button key={u._id} onClick={() => go(u.username)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-base-3 transition-colors text-left">
                        <Avatar src={getAvatarUrl(u)} alt={u.username} size={36}/>
                        <div><p className="text-sm font-medium">{u.name||u.username}</p><p className="text-xs text-muted">@{u.username}</p></div>
                      </button>
                    ))}
                  </div>
                )}
                {!loading && query.trim() && results.length === 0 && <p className="text-center text-sm text-muted py-10">No results for "{query}"</p>}
                {!query && <p className="text-center text-sm text-muted py-8">Search for people or topics</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <CreatePostModal isOpen={modal?.type === 'CREATE_POST'}/>
    </>
  );
}
