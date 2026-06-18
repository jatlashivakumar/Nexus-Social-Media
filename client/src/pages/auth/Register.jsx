import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { RiUserLine, RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiAtLine } from 'react-icons/ri';
import { registerUser, clearError, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '@/features/auth/authSlice';
import { registerSchema } from '@/validations';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoogleButton from '@/components/common/GoogleButton';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuth   = useSelector(selectIsAuthenticated);
  const loading  = useSelector(selectAuthLoading);
  const error    = useSelector(selectAuthError);
  const [show, setShow] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema) });
  useEffect(() => { if (isAuth) navigate('/', { replace: true }); return () => dispatch(clearError()); }, [isAuth]);

  const pw = watch('password', '');
  const checks = [{ l:'8+ chars', ok: pw.length>=8 }, { l:'Uppercase', ok:/[A-Z]/.test(pw) }, { l:'Number', ok:/[0-9]/.test(pw) }];

  return (
    <>
      <Helmet><title>Create account · Nexus</title></Helmet>
      <h1 className="text-2xl font-bold mb-1">Create account</h1>
      <p className="text-secondary text-sm mb-8">Join Nexus today.</p>
      {error && <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 text-sm font-medium">{error}</div>}
      <form onSubmit={handleSubmit(d => dispatch(registerUser(d)))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full name" placeholder="Alex Smith" leftIcon={RiUserLine} error={errors.name?.message} {...register('name')}/>
          <Input label="Username" placeholder="alexsmith" leftIcon={RiAtLine} error={errors.username?.message} {...register('username')}/>
        </div>
        <Input label="Email" type="email" placeholder="you@example.com" leftIcon={RiMailLine} error={errors.email?.message} {...register('email')}/>
        <div className="space-y-2">
          <Input label="Password" type={show?'text':'password'} placeholder="Min 8 chars" leftIcon={RiLockLine} error={errors.password?.message} rightElement={<button type="button" onClick={()=>setShow(!show)} className="text-muted hover:text-primary">{show?<RiEyeOffLine size={16}/>:<RiEyeLine size={16}/>}</button>} {...register('password')}/>
          {pw && <div className="flex gap-3 pt-1">{checks.map(c=><div key={c.l} className="flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${c.ok?'bg-green-500':'bg-base-3'}`}/><span className={`text-[10px] font-medium ${c.ok?'text-green-500':'text-muted'}`}>{c.l}</span></div>)}</div>}
        </div>
        <Input label="Confirm password" type={show?'text':'password'} placeholder="••••••••" leftIcon={RiLockLine} error={errors.confirmPassword?.message} {...register('confirmPassword')}/>
        <Button type="submit" loading={loading} className="w-full" size="lg">Create account</Button>
      </form>
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-base-3" />
        <span className="text-xs text-muted font-medium">OR</span>
        <div className="flex-1 h-px bg-base-3" />
      </div>
      <GoogleButton label="Sign up with Google" />
      <p className="text-center text-sm text-secondary mt-4">Already have an account? <Link to="/login" className="text-brand font-semibold hover:underline">Sign in</Link></p>
    </>
  );
}
