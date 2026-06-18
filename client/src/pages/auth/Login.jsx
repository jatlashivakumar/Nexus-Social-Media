import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { loginUser, clearError, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '@/features/auth/authSlice';
import { loginSchema } from '@/validations';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoogleButton from '@/components/common/GoogleButton';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuth   = useSelector(selectIsAuthenticated);
  const loading  = useSelector(selectAuthLoading);
  const error    = useSelector(selectAuthError);
  const [show, setShow] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => { if (isAuth) navigate('/', { replace: true }); return () => dispatch(clearError()); }, [isAuth]);

  return (
    <>
      <Helmet><title>Sign in · Nexus</title></Helmet>
      <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-secondary text-sm mb-8">Sign in to continue.</p>
      {error && <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">{error}</div>}
      <form onSubmit={handleSubmit(d => dispatch(loginUser(d)))} className="space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" leftIcon={RiMailLine} error={errors.email?.message} autoComplete="email" {...register('email')}/>
        <Input label="Password" type={show?'text':'password'} placeholder="••••••••" leftIcon={RiLockLine} error={errors.password?.message} autoComplete="current-password" rightElement={<button type="button" onClick={()=>setShow(!show)} className="text-muted hover:text-primary">{show?<RiEyeOffLine size={16}/>:<RiEyeLine size={16}/>}</button>} {...register('password')}/>
        <div className="flex justify-end"><Link to="/forgot-password" className="text-xs text-brand hover:underline font-medium">Forgot password?</Link></div>
        <Button type="submit" loading={loading} className="w-full" size="lg">Sign in</Button>
      </form>
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-base-3" />
        <span className="text-xs text-muted font-medium">OR</span>
        <div className="flex-1 h-px bg-base-3" />
      </div>
      <GoogleButton label="Sign in with Google" />
      <p className="text-center text-sm text-secondary mt-6">Don't have an account? <Link to="/register" className="text-brand font-semibold hover:underline">Sign up</Link></p>
    </>
  );
}
