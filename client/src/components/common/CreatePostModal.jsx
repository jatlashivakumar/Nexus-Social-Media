import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { RiImageAddLine, RiCloseLine, RiGlobeLine, RiLockLine, RiGroupLine } from 'react-icons/ri';
import { closeModal } from '@/features/ui/uiSlice';
import { selectUser } from '@/features/auth/authSlice';
import { postApi } from '@/services/api';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { getAvatarUrl } from '@/utils';
import toast from 'react-hot-toast';

const VIS = [
  { value:'public',    label:'Everyone', Icon:RiGlobeLine  },
  { value:'followers', label:'Followers',Icon:RiGroupLine  },
  { value:'private',   label:'Only me',  Icon:RiLockLine   },
];

export default function CreatePostModal({ isOpen }) {
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const user = useSelector(selectUser);
  const [content,    setContent]    = useState('');
  const [images,     setImages]     = useState([]);
  const [previews,   setPreviews]   = useState([]);
  const [visibility, setVisibility] = useState('public');
  const [loading,    setLoading]    = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] }, maxFiles: 10, maxSize: 10*1024*1024,
    onDrop: (files) => {
      setImages(p => [...p, ...files].slice(0,10));
      files.forEach(f => { const r = new FileReader(); r.onload = e => setPreviews(p => [...p, e.target.result]); r.readAsDataURL(f); });
    },
    onDropRejected: (r) => r.forEach(f => toast.error(f.errors[0]?.message || 'Rejected')),
  });

  const reset = () => { setContent(''); setImages([]); setPreviews([]); dispatch(closeModal()); };

  const submit = async () => {
    if (!content.trim() && images.length === 0) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content', content.trim());
      fd.append('visibility', visibility);
      images.forEach(img => fd.append('images', img));
      await postApi.create(fd);
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['userPosts'] });
      toast.success('Post published!');
      reset();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const remaining = 2200 - content.length;

  return (
    <Modal isOpen={isOpen} onClose={reset} size="md">
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Create post</h2>
          <button onClick={reset} className="p-1.5 rounded-lg hover:bg-base-3 text-muted"><RiCloseLine size={20}/></button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={getAvatarUrl(user)} alt={user?.username} size={40}/>
          <div>
            <p className="font-semibold text-sm">{user?.name||user?.username}</p>
            <div className="flex gap-1 mt-1">
              {VIS.map(({ value, label, Icon }) => (
                <button key={value} onClick={() => setVisibility(value)} className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all ${visibility===value?'bg-brand/10 text-brand':'text-muted hover:bg-base-3'}`}>
                  <Icon size={12}/>{label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="What's on your mind?" className="w-full min-h-[120px] max-h-[300px] resize-none bg-transparent text-primary placeholder:text-muted text-base leading-relaxed outline-none font-sans mb-4" autoFocus/>
        <AnimatePresence>
          {previews.length > 0 && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className={`grid gap-2 mb-4 ${previews.length===1?'grid-cols-1':'grid-cols-2'}`}>
              {previews.map((src,i) => (
                <div key={i} className="relative rounded-xl overflow-hidden bg-base-3">
                  <img src={src} alt="" className={`w-full object-cover ${previews.length===1?'max-h-64':'h-40'}`}/>
                  <button onClick={() => { setImages(p=>p.filter((_,j)=>j!==i)); setPreviews(p=>p.filter((_,j)=>j!==i)); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"><RiCloseLine size={14}/></button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {previews.length === 0 && (
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-5 mb-4 text-center cursor-pointer transition-all ${isDragActive?'border-brand bg-brand/5':'border-base hover:border-brand/50'}`}>
            <input {...getInputProps()}/>
            <RiImageAddLine size={26} className="mx-auto mb-2 text-muted"/>
            <p className="text-sm text-muted">Add photos (up to 10)</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-base">
          <div>
            {previews.length > 0 && previews.length < 10 && (
              <label {...getRootProps()} className="p-2 rounded-lg text-muted hover:text-brand hover:bg-brand/8 cursor-pointer transition-colors inline-block"><input {...getInputProps()}/><RiImageAddLine size={20}/></label>
            )}
          </div>
          <div className="flex items-center gap-3">
            {content.length > 0 && <span className={`text-xs font-medium tabular-nums ${remaining<0?'text-red-500':remaining<100?'text-amber-500':'text-muted'}`}>{remaining}</span>}
            <Button onClick={submit} loading={loading} disabled={(!content.trim()&&images.length===0)||remaining<0} size="sm">Publish</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
