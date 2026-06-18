import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiHome5Line, RiHome5Fill, RiCompassLine, RiCompassFill,
  RiMessage3Line, RiMessage3Fill, RiBellLine, RiBellFill,
  RiSettings4Line, RiSettings4Fill, RiSearchLine, RiAddCircleLine,
  RiLogoutBoxLine, RiMoonLine, RiSunLine, RiVipCrownLine,
} from 'react-icons/ri';
import { selectUser } from '@/features/auth/authSlice';
import { toggleTheme, selectTheme, setSearchOpen, openModal, selectSidebarOpen, setSidebarOpen, openLogoutModal } from '@/features/ui/uiSlice';
import { selectTotalUnread } from '@/features/chat/chatSlice';
import { selectUnreadCount } from '@/features/notifications/notificationSlice';
import Avatar from '@/components/ui/Avatar';
import { cn, getAvatarUrl } from '@/utils';

const NAV = [
  { to: '/',              label: 'Home',          Icon: RiHome5Line,     Active: RiHome5Fill     },
  { to: '/explore',       label: 'Explore',       Icon: RiCompassLine,   Active: RiCompassFill   },
  { to: '/chat',          label: 'Messages',      Icon: RiMessage3Line,  Active: RiMessage3Fill,  badge: 'chat'  },
  { to: '/notifications', label: 'Notifications', Icon: RiBellLine,      Active: RiBellFill,      badge: 'notif' },
  { to: '/settings',      label: 'Settings',      Icon: RiSettings4Line, Active: RiSettings4Fill  },
];

/** Sidebar inner content — shared between desktop + mobile drawer */
function SidebarInner({ dispatch, user, theme, chatUnread, notifUnread, onNavClick }) {
  return (
    <div className="flex flex-col h-full p-4 gap-1">

      {/* ── Brand logo ── */}
      <div className="flex items-center gap-2.5 px-3 py-4 mb-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 bg-gradient-nexus shadow-glow-sm">
          N
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-gradient">Nexus</span>
      </div>

      {/* ── Search ── */}
      <button
        onClick={() => dispatch(setSearchOpen(true))}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-base-3 transition-all mb-2 group text-left w-full"
      >
        <RiSearchLine size={20} className="flex-shrink-0" />
        <span className="text-sm font-medium">Search</span>
        <kbd className="ml-auto text-[10px] text-muted bg-base-2 border border-base px-1.5 py-0.5 rounded-md hidden group-hover:flex items-center gap-0.5">
          ⌘K
        </kbd>
      </button>

      {/* ── Nav links ── */}
      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ to, label, Icon, Active, badge }) => {
          const count = badge === 'chat' ? chatUnread : badge === 'notif' ? notifUnread : 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onNavClick}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-nexus/10 text-nexus font-semibold'
                  : 'text-secondary hover:bg-base-3 hover:text-primary',
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive ? <Active size={21} /> : <Icon size={21} />}
                  <span>{label}</span>
                  {count > 0 && (
                    <span className="ml-auto badge text-[10px]">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Upgrade to Pro (free users only) ── */}
      {user?.subscription === 'free' || !user?.subscription ? (
        <NavLink
          to="/pricing"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-nexus text-white shadow-glow-sm hover:opacity-90 mb-1"
        >
          <RiVipCrownLine size={20} />
          <span>Upgrade to Pro</span>
        </NavLink>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-nexus/8 text-nexus text-xs font-bold mb-1">
          <RiVipCrownLine size={15} />
          <span className="capitalize">{user.subscription} member</span>
        </div>
      )}

      {/* ── New Post button ── */}
      <button
        onClick={() => dispatch(openModal({ type: 'CREATE_POST' }))}
        className="btn-primary btn mt-3 w-full text-sm"
      >
        <RiAddCircleLine size={17} /> New Post
      </button>

      <div className="flex-1" />

      {/* ── Theme toggle ── */}
      <button
        onClick={() => dispatch(toggleTheme())}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-base-3 transition-all w-full"
      >
        {theme === 'dark' ? <RiSunLine size={20} /> : <RiMoonLine size={20} />}
        <span className="text-sm font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
      </button>

      {/* ── User card ── */}
      {user && (
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-3 transition-all group mt-1">
          <NavLink
            to={`/profile/${user.username}`}
            className="flex items-center gap-3 flex-1 min-w-0"
            onClick={onNavClick}
          >
            <Avatar src={getAvatarUrl(user)} alt={user.username} size={36} online />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name || user.username}</p>
              <p className="text-xs text-muted truncate">@{user.username}</p>
            </div>
          </NavLink>
          <button
            onClick={() => dispatch(openLogoutModal())}
            title="Sign out"
             className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-muted hover:text-red-500 transition-all flex-shrink-0"
            // className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-muted hover:text-red-500 transition-all flex-shrink-0"
          >
            <RiLogoutBoxLine size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const dispatch    = useDispatch();
  const user        = useSelector(selectUser);
  const theme       = useSelector(selectTheme);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const chatUnread  = useSelector(selectTotalUnread);
  const notifUnread = useSelector(selectUnreadCount);
  const props = { dispatch, user, theme, chatUnread, notifUnread };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-full z-40 w-64 xl:w-72 border-r border-base bg-base hidden lg:flex flex-col">
        <SidebarInner {...props} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => dispatch(setSidebarOpen(false))}
            />
            <motion.aside
              initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 h-full z-40 w-72 border-r border-base bg-base flex flex-col lg:hidden"
            >
              <SidebarInner {...props} onNavClick={() => dispatch(setSidebarOpen(false))} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
