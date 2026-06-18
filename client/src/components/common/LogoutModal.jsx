import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiLogoutBoxLine, RiCloseLine, RiAlertLine } from 'react-icons/ri';
import { logoutUser } from '@/features/auth/authSlice';
import { closeLogoutModal, selectLogoutModalOpen } from '@/features/ui/uiSlice';

export default function LogoutModal() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isOpen    = useSelector(selectLogoutModalOpen);
  const [loading, setLoading] = useState(false);

  const handleCancel = () => dispatch(closeLogoutModal());

  const handleLogout = async () => {
    setLoading(true);
    try {
      await dispatch(logoutUser());
      dispatch(closeLogoutModal());
      navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: 20  }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="relative z-10 w-full max-w-sm bg-base border border-base rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* close button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-base-3 text-muted transition-colors"
            >
              <RiCloseLine size={18} />
            </button>

            <div className="p-7 text-center">
              {/* icon */}
              <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
                <RiLogoutBoxLine size={30} className="text-red-500" />
              </div>

              <h2 className="text-xl font-bold mb-2">Sign out?</h2>
              <p className="text-sm text-secondary leading-relaxed mb-7">
                You'll need to sign back in to access your account and messages.
              </p>

              {/* actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 btn-secondary btn py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex-1 btn py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                  ) : (
                    <RiLogoutBoxLine size={16} />
                  )}
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
