import { cn } from '@/utils';

/**
 * Generic form field wrapper with label, error, hint.
 * Works with react-hook-form or plain onChange.
 */
export function FormField({ label, error, hint, required, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-semibold text-primary">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1">⚠ {error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
