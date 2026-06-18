import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine } from 'react-icons/ri';
import { cn } from '@/utils';
const sizes = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
export default function Modal({ isOpen, onClose, title, children, size='md', className }) {
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  useEffect(() => { const fn = e => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', fn); return () => document.removeEventListener('keydown', fn); }, [onClose]);
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.2}} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
          <motion.div initial={{opacity:0,scale:.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.95,y:20}} transition={{type:'spring',damping:30,stiffness:350}} className={cn('relative z-10 w-full bg-base border border-base rounded-2xl shadow-2xl overflow-hidden',sizes[size],className)}>
            {title ? (
              <div className="flex items-center justify-between px-5 py-4 border-b border-base">
                <h2 className="font-display font-bold text-lg">{title}</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-base-3 text-muted transition-colors"><RiCloseLine size={20}/></button>
              </div>
            ) : (
              <button onClick={onClose} className="absolute top-4 right-4 z-10 p-1.5 rounded-lg hover:bg-base-3 text-muted transition-colors"><RiCloseLine size={20}/></button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
