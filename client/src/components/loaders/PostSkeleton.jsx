export default function PostSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="skeleton w-11 h-11 rounded-full" />
            <div className="flex-1 space-y-2"><div className="skeleton h-3.5 w-32 rounded" /><div className="skeleton h-3 w-20 rounded" /></div>
          </div>
          <div className="space-y-2"><div className="skeleton h-3.5 w-full rounded" /><div className="skeleton h-3.5 w-4/5 rounded" /><div className="skeleton h-3.5 w-3/5 rounded" /></div>
          <div className="skeleton h-52 w-full rounded-2xl" />
          <div className="flex gap-4"><div className="skeleton h-8 w-20 rounded-xl" /><div className="skeleton h-8 w-20 rounded-xl" /><div className="skeleton h-8 w-20 rounded-xl" /></div>
        </div>
      ))}
    </>
  );
}
