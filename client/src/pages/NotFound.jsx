import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { RiHome5Line, RiArrowLeftLine } from 'react-icons/ri';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet><title>404 · Page not found · Nexus</title></Helmet>
      <div className="min-h-screen flex items-center justify-center p-6 bg-base">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center max-w-sm w-full">
          <div className="relative mb-6 inline-block">
            <p className="text-[96px] font-bold text-gradient leading-none select-none">404</p>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand animate-ping opacity-30" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-secondary text-sm mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="btn-secondary btn gap-2">
              <RiArrowLeftLine size={16} /> Go back
            </button>
            <button onClick={() => navigate('/')} className="btn-primary btn gap-2">
              <RiHome5Line size={16} /> Home
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
