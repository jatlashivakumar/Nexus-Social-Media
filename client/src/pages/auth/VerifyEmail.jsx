import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';
import { authApi } from '@/services/api';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  useEffect(() => { authApi.verifyEmail(token).then(()=>setStatus('success')).catch(()=>setStatus('error')); }, [token]);
  return (
    <>
      <Helmet><title>Verify email · Nexus</title></Helmet>
      <div className="text-center">
        {status==='loading' && <div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"/><p className="text-secondary">Verifying…</p></div>}
        {status==='success' && (<><div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5"><RiCheckLine size={32} className="text-green-600"/></div><h2 className="text-xl font-bold mb-2">Email verified!</h2><p className="text-secondary text-sm mb-6">Your email has been verified successfully.</p><Link to="/login" className="btn-primary btn">Continue to login</Link></>)}
        {status==='error'   && (<><div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5"><RiErrorWarningLine size={32} className="text-red-500"/></div><h2 className="text-xl font-bold mb-2">Link expired</h2><p className="text-secondary text-sm mb-6">Please request a new verification email.</p><Link to="/login" className="btn-primary btn">Back to login</Link></>)}
      </div>
    </>
  );
}
