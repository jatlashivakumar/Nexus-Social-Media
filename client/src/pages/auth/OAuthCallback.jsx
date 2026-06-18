import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCurrentUser } from '@/features/auth/authSlice';
import toast from 'react-hot-toast';

/**
 * Lands here after the backend redirects from /api/auth/google/callback.
 * URL looks like: /oauth/callback?token=<accessToken>
 * We grab the token, store it, fetch the user, then go home.
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('accessToken', token);
    dispatch(fetchCurrentUser()).then((res) => {
      if (res.payload) {
        toast.success('Signed in with Google!');
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    });
  }, [searchParams, dispatch, navigate]);

  return (
    <>
      <Helmet><title>Signing in… · Nexus</title></Helmet>
      <div className="fixed inset-0 flex items-center justify-center bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-nexus/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-nexus border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <p className="text-sm text-secondary font-medium">Completing sign-in…</p>
        </div>
      </div>
    </>
  );
}
