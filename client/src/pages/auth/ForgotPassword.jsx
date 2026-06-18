import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { RiMailLine, RiArrowLeftLine, RiCheckLine } from 'react-icons/ri';
import { authApi } from '@/services/api';
import { forgotPasswordSchema } from '@/validations';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try { await authApi.forgotPassword(email); setSent(true); }
    catch (e) { toast.error(e?.response?.data?.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5"><RiCheckLine size={32} className="text-green-600"/></div>
      <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
      <p className="text-secondary text-sm mb-6">If that email is registered, a reset link has been sent.</p>
      <Link to="/login" className="btn-primary btn">Back to login</Link>
    </div>
  );

  return (
    <>
      <Helmet><title>Forgot password · Nexus</title></Helmet>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-muted hover:text-primary text-sm mb-6"><RiArrowLeftLine size={16}/>Back to login</Link>
      <h1 className="text-2xl font-bold mb-1">Forgot password?</h1>
      <p className="text-secondary text-sm mb-8">We'll send you a reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" leftIcon={RiMailLine} error={errors.email?.message} {...register('email')}/>
        <Button type="submit" loading={loading} className="w-full" size="lg">Send reset link</Button>
      </form>
    </>
  );
}
