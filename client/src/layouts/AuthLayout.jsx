import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-base">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{background:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#2563eb 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 50%,white 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-xl">M</div>
          <span className="text-white font-bold text-xl">Nexus</span>
        </div>
        <div className="relative z-10">
          <blockquote className="text-white/90 text-2xl font-light leading-relaxed mb-6">"Connect, share, and discover stories that matter."</blockquote>
          <div className="flex gap-2">{[0,1,2].map(i=><div key={i} className={`h-1 rounded-full ${i===0?'w-8 bg-white':'w-4 bg-white/30'}`}/>)}</div>
        </div>
        <p className="relative z-10 text-white/50 text-sm">© {new Date().getFullYear()} Nexus</p>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.4}} className="w-full max-w-[420px]">
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{background:'linear-gradient(135deg,#6366f1,#7c3aed)'}}>M</div>
            <span className="font-bold text-lg">Nexus</span>
          </div>
          <Outlet/>
        </motion.div>
      </div>
    </div>
  );
}
