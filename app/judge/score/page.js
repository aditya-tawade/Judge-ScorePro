'use client';

import { useState, useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';
import { Gavel, Star, Send, CheckCircle2, Loader2, User, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';

export default function JudgeScoring() {
    const [activeParticipant, setActiveParticipant] = useState(null);
    const [event, setEvent] = useState(null);
    const [scores, setScores] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [judgeId, setJudgeId] = useState('');
    const [judgeName, setJudgeName] = useState('');
    const [notification, setNotification] = useState(null);
    const router = useRouter();

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        const jId = localStorage.getItem('judgeId');
        const jName = localStorage.getItem('judgeName');
        if (!jId) {
            router.push('/judge');
            return;
        }
        setJudgeId(jId);
        setJudgeName(jName);

        // Verify judge still exists in DB
        fetch('/api/judges').then(res => res.json()).then(data => {
            if (!data.find(j => j._id === jId)) {
                localStorage.clear();
                router.push('/judge');
            }
        });

        // Initial check for active participant
        fetchActiveParticipant();

        const channel = pusherClient.subscribe('competition');
        channel.bind('participant-active', (data) => {
            setActiveParticipant(data.participant);
            setIsSubmitted(false);
            setScores({});
            fetchEventDetails(data.participant.eventId);
        });

        return () => {
            pusherClient.unsubscribe('competition');
        };
    }, []);

    const fetchActiveParticipant = async () => {
        const res = await fetch('/api/participants?status=active');
        const data = await res.json();
        if (data.length > 0) {
            setActiveParticipant(data[0]);
            fetchEventDetails(data[0].eventId);
            checkIfAlreadySubmitted(data[0]._id, localStorage.getItem('judgeId'));
        }
    };

    const fetchEventDetails = async (eventId) => {
        const res = await fetch('/api/events');
        const data = await res.json();
        const evt = data.find(e => e._id === eventId);
        setEvent(evt);
        // Keep scores empty initially so they are "blank"
        setScores({});
    };

    const checkIfAlreadySubmitted = async (participantId, jId) => {
        const res = await fetch(`/api/scores?participantId=${participantId}`);
        const data = await res.json();
        if (data.find(s => s.judgeId === jId)) {
            setIsSubmitted(true);
        }
    };

    const handleScoreChange = (criteria, value) => {
        setScores(prev => ({ ...prev, [criteria]: value }));
    };

    const submitScore = async () => {
        const isAllScored = event.criteria.every(c => scores[c.name] !== undefined);
        if (!isAllScored) {
            showNotification("Please provide a score for all criteria.", "error");
            return;
        }

        setIsSubmitting(true);
        const values = Object.values(scores);
        const total = values.reduce((a, b) => a + b, 0) / values.length;

        const res = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: activeParticipant._id,
                judgeId,
                judgeName,
                scores,
                totalScore: parseFloat(total.toFixed(2)),
                eventId: activeParticipant.eventId
            }),
        });

        if (res.ok) {
            setIsSubmitted(true);
        } else {
            const error = await res.json();
            showNotification(error.error || 'Failed to submit score', "error");
            if (res.status === 401 || res.status === 403) {
                setTimeout(() => {
                    localStorage.clear();
                    router.push('/judge');
                }, 2000);
            }
        }
        setIsSubmitting(false);
    };

    if (!activeParticipant) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Loader2 className="text-slate-700 animate-spin" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-300">Awaiting Participant</h2>
                <p className="text-slate-500 mt-2 max-w-xs">The competition is ready. Please wait for the admin to start the next performance.</p>
                <div className="mt-8 px-4 py-2 bg-slate-900/50 rounded-full border border-slate-800 flex items-center gap-2">
                    <User size={14} className="text-indigo-400" />
                    <span className="text-xs font-medium text-slate-400">Judging as {judgeName}</span>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
                    <CheckCircle2 className="text-emerald-500" size={48} />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Submission Recorded</h2>
                <p className="text-slate-400 max-w-xs">Your scores for <strong>{activeParticipant.name}</strong> have been sent to the leaderboard.</p>
                <p className="text-slate-600 mt-8 text-sm italic">Waiting for the next participant...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-6 pb-32">
            <header className="mb-10 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Current Performer</div>
                <h1 className="text-4xl font-black tracking-tight">{activeParticipant.name}</h1>
                <p className="text-slate-500 font-medium mt-1">{event?.name}</p>
            </header>

            <div className="space-y-8">
                {event?.criteria.map((c, idx) => (
                    <div key={idx} className="glass rounded-3xl p-6 border border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-200">{c.name}</h3>
                            <div className="text-3xl font-black text-indigo-400">
                                {scores[c.name] !== undefined ? scores[c.name] : '-'}
                            </div>
                        </div>

                        <div className="grid grid-cols-6 gap-2 sm:gap-3">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                                <button
                                    key={val}
                                    onClick={() => handleScoreChange(c.name, val)}
                                    className={clsx(
                                        "aspect-square rounded-xl flex items-center justify-center font-bold text-lg transition-all border",
                                        scores[c.name] === val
                                            ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] scale-110 z-10"
                                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600"
                                    )}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between mt-4 px-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            <span>Fair (0)</span>
                            <span>Exceptional (10)</span>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 z-50">
                <button
                    onClick={submitScore}
                    disabled={isSubmitting || !event?.criteria.every(c => scores[c.name] !== undefined)}
                    className="w-full premium-gradient h-16 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100"
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            SUBMIT SCORE <Send size={20} />
                        </>
                    )}
                </button>
            </footer>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 w-[90%] max-w-md">
                    <div className={clsx(
                        "flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border",
                        notification.type === 'error'
                            ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                            : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    )}>
                        {notification.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                        <span className="font-bold text-sm tracking-wide flex-1">{notification.message}</span>
                        <button onClick={() => setNotification(null)} className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
