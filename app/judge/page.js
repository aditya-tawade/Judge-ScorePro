'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gavel, Key, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

function JudgeJoinContent() {
    const [passcode, setPasscode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            setPasscode(code.toUpperCase());
            handleAutoJoin(code);
        }
    }, [searchParams]);

    const handleAutoJoin = async (code) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/judges/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode: code }),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('judgeId', data.judge.id);
                localStorage.setItem('judgeName', data.judge.name);
                localStorage.setItem('judgePasscode', code.toUpperCase());
                router.push('/judge/score');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!passcode.trim()) return;
        await handleAutoJoin(passcode);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
            <div className="w-full max-w-md">
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20 rotate-12">
                        <Gavel size={40} className="text-white -rotate-12" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Access Portal</h1>
                    <p className="text-slate-400">Enter your Judge Passcode to begin</p>
                </div>

                <form onSubmit={handleJoin} className="glass rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="text-indigo-500 animate-spin" size={40} />
                            <div className="text-xs font-black uppercase tracking-widest text-indigo-400">Verifying Access...</div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Passcode</label>
                            <div className="relative">
                                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter 8-character code"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-600 transition-all font-mono tracking-[0.2em] text-center text-xl uppercase"
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value.toUpperCase().slice(0, 8))}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || passcode.length < 8}
                            className="w-full premium-gradient text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-indigo-500/10 group disabled:opacity-30 disabled:grayscale"
                        >
                            Authorize Entry <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>

                <div className="mt-12 flex items-center justify-center gap-2 text-slate-600">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Evaluation Terminal</span>
                </div>
            </div>
        </div>
    );
}

export default function JudgeJoin() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-500"><Loader2 className="animate-spin" /></div>}>
            <JudgeJoinContent />
        </Suspense>
    );
}
