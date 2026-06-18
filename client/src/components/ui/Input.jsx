import { forwardRef } from 'react';
import { cn } from '@/utils';
const Input = forwardRef(function Input({ label, error, hint, leftIcon: L, rightElement, className, id, ...p }, ref) {
  const iid = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={iid} className="text-sm font-semibold text-primary">{label}</label>}
      <div className="relative">
        {L && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"><L size={16}/></span>}
        <input ref={ref} id={iid} className={cn('input-base', L && 'pl-9', rightElement && 'pr-10', error && 'input-error', className)} {...p}/>
        {rightElement && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
});
export default Input;
