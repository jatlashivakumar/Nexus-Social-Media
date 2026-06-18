import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { authApi } from '@/services/api';
import { resetPasswordSchema } from '@/validations';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [show,    setShow]    = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async ({ password }) => {
    setLoading(true);
    try { await authApi.resetPassword(token, password); toast.success('Password reset! Please log in.'); navigate('/login'); }
    catch (e) { toast.error(e?.response?.data?.message || 'Link may have expired.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Helmet><title>New password · Nexus</title></Helmet>
      <h1 className="text-2xl font-bold mb-1">Set new password</h1>
      <p className="text-secondary text-sm mb-8">Choose a strong password.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New password" type={show?'text':'password'} placeholder="••••••••" leftIcon={RiLockLine} error={errors.password?.message} rightElement={<button type="button" onClick={()=>setShow(!show)} className="text-muted hover:text-primary">{show?<RiEyeOffLine size={16}/>:<RiEyeLine size={16}/>}</button>} {...register('password')}/>
        <Input label="Confirm password" type={show?'text':'password'} placeholder="••••••••" leftIcon={RiLockLine} error={errors.confirmPassword?.message} {...register('confirmPassword')}/>
        <Button type="submit" loading={loading} className="w-full" size="lg">Reset password</Button>
      </form>
    </>
  );
}
