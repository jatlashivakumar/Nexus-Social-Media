import { cn } from '@/utils';
const S = {24:'w-6 h-6',28:'w-7 h-7',32:'w-8 h-8',34:'w-[34px] h-[34px]',36:'w-9 h-9',40:'w-10 h-10',44:'w-11 h-11',46:'w-[46px] h-[46px]',48:'w-12 h-12',56:'w-14 h-14',64:'w-16 h-16',72:'w-[72px] h-[72px]',80:'w-20 h-20',96:'w-24 h-24'};
export default function Avatar({ src, alt, size = 40, className, online }) {
  const sz = S[size] || 'w-10 h-10';
  const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(alt||'U')}&backgroundColor=6366f1&textColor=ffffff&fontSize=42`;
  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      <img src={src || fallback} alt={alt || ''} className={cn('rounded-full object-cover bg-base-3', sz)}
        onError={e => { e.currentTarget.src = fallback; }} />
      {online !== undefined && (
        <span className={cn('absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900', size >= 48 ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5', online ? 'bg-emerald-500' : 'bg-gray-400')} />
      )}
    </div>
  );
}
