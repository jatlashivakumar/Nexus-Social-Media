export default function UserSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="skeleton w-11 h-11 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2"><div className="skeleton h-3.5 w-28 rounded" /><div className="skeleton h-3 w-20 rounded" /></div>
          <div className="skeleton h-8 w-20 rounded-xl" />
        </div>
      ))}
    </>
  );
}
