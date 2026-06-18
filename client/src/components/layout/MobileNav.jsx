import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RiHome5Line,RiHome5Fill,RiCompassLine,RiCompassFill,RiAddCircleLine,RiMessage3Line,RiMessage3Fill,RiBellLine,RiBellFill } from 'react-icons/ri';
import { openModal } from '@/features/ui/uiSlice';
import { selectTotalUnread } from '@/features/chat/chatSlice';
import { selectUnreadCount } from '@/features/notifications/notificationSlice';
import { cn } from '@/utils';

const NAV = [
  { to:'/',              label:'Home',    Icon:RiHome5Line,    Active:RiHome5Fill    },
  { to:'/explore',       label:'Explore', Icon:RiCompassLine,  Active:RiCompassFill  },
  { type:'create' },
  { to:'/chat',          label:'Chat',    Icon:RiMessage3Line, Active:RiMessage3Fill, badge:'chat'  },
  { to:'/notifications', label:'Alerts',  Icon:RiBellLine,     Active:RiBellFill,     badge:'notif' },
];

export default function MobileNav() {
  const dispatch    = useDispatch();
  const chatUnread  = useSelector(selectTotalUnread);
  const notifUnread = useSelector(selectUnreadCount);
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden glass border-t border-base">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV.map((item, i) => {
          if (item.type === 'create') return (
            <button key="c" onClick={() => dispatch(openModal({ type:'CREATE_POST' }))} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-transform flex-shrink-0" style={{background:'linear-gradient(135deg,#6366f1,#7c3aed)'}}>
              <RiAddCircleLine size={26}/>
            </button>
          );
          const count = item.badge === 'chat' ? chatUnread : item.badge === 'notif' ? notifUnread : 0;
          return (
            <NavLink key={item.to} to={item.to} end={item.to==='/'} className={({ isActive }) => cn('relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all', isActive ? 'text-brand' : 'text-muted')}>
              {({ isActive }) => (<>
                {isActive ? <item.Active size={24}/> : <item.Icon size={24}/>}
                <span className="text-[10px] font-medium">{item.label}</span>
                {count > 0 && <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">{count > 9 ? '9+' : count}</span>}
              </>)}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
