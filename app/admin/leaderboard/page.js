'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { pusherClient } from '@/lib/pusher';
import { Trophy, Medal, Crown, ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

function LeaderboardContent() {
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId');
    const [leaderboard, setLeaderboard] = useState([]);
    const [eventName, setEventName] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [judgeScores, setJudgeScores] = useState([]);
    const [loadingScores, setLoadingScores] = useState(false);

    useEffect(() => {
        if (eventId) {
            fetchData();
            const channel = pusherClient.subscribe('competition');
            channel.bind('leaderboard-update', (data) => {
                if (data.eventId === eventId) {
                    setLeaderboard(data.leaderboard);
                }
            });
            return () => pusherClient.unsubscribe('competition');
        }
    }, [eventId]);

    const fetchData = async () => {
        const res = await fetch(`/api/results?eventId=${eventId}`);
        const data = await res.json();
        setLeaderboard(data);

        const evres = await fetch('/api/events');
        const evdata = await evres.json();
        const evt = evdata.find(e => e._id === eventId);
        if (evt) setEventName(evt.name);
    };

    const toggleDetails = async (pId) => {
        if (expandedId === pId) {
            setExpandedId(null);
            return;
        }

        setExpandedId(pId);
        setLoadingScores(true);
        try {
            const res = await fetch(`/api/scores?participantId=${pId}`);
            const data = await res.json();
            setJudgeScores(data);
        } catch (e) {
            console.error(e);
        }
        setLoadingScores(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-12">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <Link href="/admin" className="text-slate-500 hover:text-slate-300 flex items-center gap-2 mb-4 transition-colors text-sm">
                            <ArrowLeft size={14} /> Back to Controls
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-black">{eventName}</h1>
                        <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm md:text-base">
                            <Trophy size={18} className="text-amber-500 shrink-0" /> Official Results Leaderboard
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-24 h-24 bg-indigo-600/20 rounded-3xl flex items-center justify-center border border-indigo-500/30">
                            <Trophy size={48} className="text-indigo-400" />
                        </div>
                    </div>
                </header>

                <div className="space-y-4">
                    {leaderboard.length > 0 ? (
                        leaderboard.map((player, idx) => {
                            const currentRank = idx + 1;
                            let displayRank = currentRank;
                            if (idx > 0 && player.averageScore === leaderboard[idx - 1].averageScore) {
                                let firstIdx = idx;
                                while (firstIdx > 0 && leaderboard[firstIdx - 1].averageScore === player.averageScore) {
                                    firstIdx--;
                                }
                                displayRank = firstIdx + 1;
                            }

                            const isExpanded = expandedId === player._id;

                            return (
                                <div
                                    key={player._id}
                                    className={clsx(
                                        "relative group overflow-hidden rounded-[2rem] p-1 transition-all",
                                        displayRank === 1 ? "premium-gradient" : "bg-slate-800/50"
                                    )}
                                >
                                    <div className="bg-slate-950 rounded-[1.8rem] p-4 md:p-6">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={clsx(
                                                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg md:text-xl font-black shrink-0",
                                                    displayRank === 1 ? "bg-amber-500 text-slate-950" :
                                                        displayRank === 2 ? "bg-slate-300 text-slate-950" :
                                                            displayRank === 3 ? "bg-orange-600 text-slate-950" :
                                                                "bg-slate-800 text-slate-500"
                                                )}>
                                                    {displayRank === 1 ? <Crown size={20} className="md:w-6 md:h-6" /> : displayRank}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl md:text-2xl font-bold truncate">{player.name}</h3>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">
                                                        {player.participantNumber ? `#${player.participantNumber}` : 'Participant'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 pt-4 md:pt-0 border-t border-slate-900 md:border-t-0">
                                                <button
                                                    onClick={() => toggleDetails(player._id)}
                                                    className={clsx(
                                                        "flex items-center gap-2 px-3 py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border",
                                                        isExpanded ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                                                    )}
                                                >
                                                    <span className="hidden xs:inline">{isExpanded ? 'Hide Scores' : 'Check Judge Scores'}</span>
                                                    <span className="xs:hidden">{isExpanded ? 'Scores' : 'Check'}</span>
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>

                                                <div className="text-right">
                                                    <div className="text-3xl md:text-4xl font-black text-white tabular-nums">
                                                        {player.averageScore.toFixed(2)}
                                                    </div>
                                                    <div className="text-[9px] md:text-[10px] text-slate-600 font-black uppercase tracking-widest">Avg Score</div>
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-8 pt-8 border-t border-slate-900/50 animate-in slide-in-from-top-4 duration-300">
                                                {loadingScores ? (
                                                    <div className="flex justify-center py-8">
                                                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {judgeScores.map((score, sIdx) => (
                                                            <div key={sIdx} className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors">
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <div className="font-bold text-indigo-400 text-sm truncate pr-2">
                                                                        {score.judgeName || `Judge ${score.judgeId}`}
                                                                    </div>
                                                                    <div className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg text-xs font-black">
                                                                        {score.totalScore.toFixed(2)}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {Object.entries(score.scores).map(([crit, val]) => (
                                                                        <div key={crit} className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                                                                            <span className="text-slate-500">{crit}</span>
                                                                            <span className="text-slate-300">{val} / 10</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
                            <Medal size={48} className="mx-auto text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium">No results recorded yet for this event.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Leaderboard...</div>}>
            <LeaderboardContent />
        </Suspense>
    );
}
