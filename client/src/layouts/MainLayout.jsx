import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectSidebarOpen, setSidebarOpen } from '@/features/ui/uiSlice';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import SearchModal from '@/components/common/SearchModal';
import LogoutModal from '@/components/common/LogoutModal';

export default function MainLayout() {
  const open = useSelector(selectSidebarOpen);
  const dispatch = useDispatch();
  return (
    <div className="flex min-h-screen bg-base">
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => dispatch(setSidebarOpen(false))}/>}
      <Sidebar/>
      <main className="flex-1 lg:ml-64 xl:ml-72 min-h-screen pb-20 lg:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Outlet/>
        </div>
      </main>
      <MobileNav/>
      <SearchModal/>
      <LogoutModal/>
    </div>
  );
}
