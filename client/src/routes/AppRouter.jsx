import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { lazy, Suspense } from 'react';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import PageLoader from '@/components/loaders/PageLoader';

const Feed          = lazy(() => import('@/pages/Feed'));
const Explore       = lazy(() => import('@/pages/Explore'));
const Profile       = lazy(() => import('@/pages/users/Profile'));
const PostDetail    = lazy(() => import('@/pages/posts/PostDetail'));
const Chat          = lazy(() => import('@/pages/chat/Chat'));
const Notifications = lazy(() => import('@/pages/notifications/Notifications'));
const Settings      = lazy(() => import('@/pages/Settings'));
const Pricing       = lazy(() => import('@/pages/Pricing'));
const Login         = lazy(() => import('@/pages/auth/Login'));
const Register      = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword= lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const VerifyEmail   = lazy(() => import('@/pages/auth/VerifyEmail'));
const OAuthCallback = lazy(() => import('@/pages/auth/OAuthCallback'));
const NotFound      = lazy(() => import('@/pages/NotFound'));

const Private = ({ children }) => { const a = useSelector(selectIsAuthenticated); return a ? children : <Navigate to="/login" replace />; };
const Guest   = ({ children }) => { const a = useSelector(selectIsAuthenticated); return !a ? children : <Navigate to="/" replace />; };

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        <Route element={<Guest><AuthLayout /></Guest>}>
          <Route path="/login"                 element={<Login />} />
          <Route path="/register"              element={<Register />} />
          <Route path="/forgot-password"       element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token"   element={<VerifyEmail />} />
        </Route>
        <Route element={<Private><MainLayout /></Private>}>
          <Route path="/"                      element={<Feed />} />
          <Route path="/explore"               element={<Explore />} />
          <Route path="/profile/:username"     element={<Profile />} />
          <Route path="/posts/:id"             element={<PostDetail />} />
          <Route path="/chat"                  element={<Chat />} />
          <Route path="/chat/:conversationId"  element={<Chat />} />
          <Route path="/notifications"         element={<Notifications />} />
          <Route path="/settings"              element={<Settings />} />
          <Route path="/pricing"               element={<Pricing />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
