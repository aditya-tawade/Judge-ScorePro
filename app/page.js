import Link from 'next/link';
import { Gavel, ShieldCheck, Trophy, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-16 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-sm font-bold mb-6">
            <Trophy size={16} /> Competition Management System
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
            Judge Score<span className="text-indigo-500">Pro</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
            The ultimate real-time scoring platform for dance, singing, and talent competitions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <Link
            href="/admin"
            className="group relative overflow-hidden glass rounded-[2.5rem] p-10 transition-all hover:translate-y-[-8px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck size={120} />
            </div>
            <div className="flex flex-col h-full">
              <div className="w-16 h-16 bg-white text-slate-950 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:rotate-6 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-3">Admin Panel</h2>
              <p className="text-slate-400 font-medium">Create events, manage participants, and control the live competition flow.</p>
              <div className="mt-auto pt-8 flex items-center gap-2 text-indigo-400 font-bold">
                Access Dashboard <Gavel size={18} />
              </div>
            </div>
          </Link>

          <Link
            href="/judge"
            className="group relative overflow-hidden glass rounded-[2.5rem] p-10 transition-all hover:translate-y-[-8px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={120} />
            </div>
            <div className="flex flex-col h-full">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20 group-hover:-rotate-6 transition-transform">
                <Gavel size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-3">Judge Entry</h2>
              <p className="text-slate-400 font-medium">Join a live session, evaluate performers, and submit real-time scores from your phone.</p>
              <div className="mt-auto pt-8 flex items-center gap-2 text-indigo-400 font-bold">
                Join as Judge <Users size={18} />
              </div>
            </div>
          </Link>
        </div>

        <footer className="mt-20 text-slate-600 text-xs font-black uppercase tracking-[0.4em]">
          Powered by Next.js & MongoDB
        </footer>
      </main>
    </div>
  );
}
