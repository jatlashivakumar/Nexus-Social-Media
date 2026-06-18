import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, selectIsInitialized } from '@/features/auth/authSlice';
import { selectTheme } from '@/features/ui/uiSlice';
import AppRouter from './routes/AppRouter';
import { useSocketInit } from './hooks/useSocket';
import PageLoader from './components/loaders/PageLoader';

export default function App() {
  const dispatch       = useDispatch();
  const isInitialized  = useSelector(selectIsInitialized);
  const theme          = useSelector(selectTheme);

  // Sync theme class on <html> whenever Redux theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);

  // Bootstrap: load current user on app start
  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      dispatch(fetchCurrentUser());
    } else {
      dispatch({ type: 'auth/setInitialized' });
    }
  }, [dispatch]);

  // Connect socket once user is authenticated
  useSocketInit();

  if (!isInitialized) return <PageLoader />;
  return <AppRouter />;
}
