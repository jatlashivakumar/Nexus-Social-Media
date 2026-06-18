export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-base z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-nexus/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-nexus border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <span className="text-sm font-semibold text-gradient">Nexus</span>
      </div>
    </div>
  );
}
