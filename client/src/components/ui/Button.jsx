import { cn } from '@/utils';
const V = { primary:'btn-primary', secondary:'btn-secondary', ghost:'btn-ghost', danger:'btn-danger', outline:'btn-outline' };
const Sz = { sm:'px-3 py-1.5 text-xs rounded-lg', md:'', lg:'px-6 py-3 text-base' };
export default function Button({ children, variant='primary', size='md', loading, className, disabled, ...p }) {
  return (
    <button className={cn('btn', V[variant], Sz[size], className)} disabled={disabled || loading} {...p}>
      {loading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
      {children}
    </button>
  );
}
