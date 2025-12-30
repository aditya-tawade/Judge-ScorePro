'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel, User, ArrowRight } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function JudgeJoin() {
    const [name, setName] = useState('');
    const router = useRouter();

    const handleJoin = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const judgeId = nanoid(5);
        localStorage.setItem('judgeId', judgeId);
        localStorage.setItem('judgeName', name);
        router.push('/judge/score');
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
            <div className="w-full max-w-md">
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20 rotate-12">
                        <Gavel size={40} className="text-white -rotate-12" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-3">Judge Entry</h1>
                    <p className="text-slate-400">Join the live scoring session</p>
                </div>

                <form onSubmit={handleJoin} className="glass rounded-3xl p-8 border border-slate-800 shadow-2xl">
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Display Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter your name"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-600 transition-all"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full premium-gradient text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-indigo-500/10 group"
                        >
                            Start Judging <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>

                <p className="text-center mt-12 text-slate-600 text-xs font-medium uppercase tracking-[0.2em]">
                    Judge Score Pro v1.0
                </p>
            </div>
        </div>
    );
}
