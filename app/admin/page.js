'use client';

import { useState, useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';
import { Plus, Users, Trophy, Play, CheckCircle, Clock, ChevronRight, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

import Link from 'next/link';

export default function AdminDashboard() {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [activeParticipant, setActiveParticipant] = useState(null);
    const [judgeSubmissions, setJudgeSubmissions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ name: '', criteria: [] });
    const [newParticipant, setNewParticipant] = useState({ name: '', number: '' });
    const [eventToDelete, setEventToDelete] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchParticipants(selectedEvent._id);
        }
    }, [selectedEvent]);

    useEffect(() => {
        const channel = pusherClient.subscribe('competition');

        // The actual binding logic for score-submitted will be handled in a separate useEffect
        // that depends on activeParticipant to ensure the correct participant context.
        // This useEffect only ensures the channel is subscribed and unsubscribed once.

        return () => {
            pusherClient.unsubscribe('competition');
        };
    }, []); // Only once for channel subscription/unsubscription

    // Re-bind when activeParticipant changes to ensure the handler has the latest activeParticipant
    useEffect(() => {
        if (!activeParticipant) return;

        const channel = pusherClient.subscribe('competition'); // Get the existing channel instance
        const handler = (data) => {
            if (data.participantId === activeParticipant._id) {
                setJudgeSubmissions(prev => {
                    if (prev.find(s => s.judgeId === data.judgeId)) return prev;
                    return [...prev, data];
                });
            }
        };

        channel.bind('score-submitted', handler);
        return () => {
            channel.unbind('score-submitted', handler); // Unbind the specific handler
        };
    }, [activeParticipant]);


    const fetchEvents = async () => {
        const res = await fetch('/api/events');
        const data = await res.json();
        setEvents(data);
    };

    const fetchParticipants = async (eventId) => {
        const res = await fetch(`/api/participants?eventId=${eventId}`);
        const data = await res.json();
        setParticipants(data);
        const active = data.find(p => p.status === 'active');
        if (active) {
            setActiveParticipant(active);
            fetchScores(active._id);
        }
    };

    const fetchScores = async (participantId) => {
        const res = await fetch(`/api/scores?participantId=${participantId}`);
        const data = await res.json();
        setJudgeSubmissions(data);
    };

    const createEvent = async () => {
        const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEvent),
        });
        if (res.ok) {
            fetchEvents();
            setIsModalOpen(false);
            setNewEvent({ name: '', criteria: [] });
        }
    };

    const addParticipant = async () => {
        const res = await fetch('/api/participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...newParticipant,
                eventId: selectedEvent._id,
                participantNumber: newParticipant.number
            }),
        });
        if (res.ok) {
            fetchParticipants(selectedEvent._id);
            setNewParticipant({ name: '', number: '' });
        }
    };

    const startScoring = async (participant) => {
        const res = await fetch('/api/participants', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: participant._id, status: 'active' }),
        });
        if (res.ok) {
            setActiveParticipant({ ...participant, status: 'active' });
            setJudgeSubmissions([]);
        }
    };

    const recordMarks = async () => {
        const res = await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: activeParticipant._id,
                eventId: selectedEvent._id
            }),
        });
        if (res.ok) {
            setActiveParticipant(null);
            setJudgeSubmissions([]);
            fetchParticipants(selectedEvent._id);
        }
    };

    const deleteEvent = async () => {
        if (!eventToDelete) return;
        const res = await fetch(`/api/events/${eventToDelete._id}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            if (selectedEvent?._id === eventToDelete._id) {
                setSelectedEvent(null);
                setParticipants([]);
                setActiveParticipant(null);
            }
            fetchEvents();
            setEventToDelete(null);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth', { method: 'DELETE' });
        router.push('/admin/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        Judge Score Pro
                    </h1>
                    <p className="text-slate-400">Admin Control Center</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
                    >
                        <Plus size={20} /> Create Event
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Event Selector */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="glass rounded-2xl p-6 border border-slate-800">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Trophy className="text-amber-400" /> Active Events
                        </h2>
                        <div className="space-y-3">
                            {events.map(event => (
                                <div
                                    key={event._id}
                                    className={clsx(
                                        "w-full flex items-center gap-2 group",
                                    )}
                                >
                                    <button
                                        onClick={() => setSelectedEvent(event)}
                                        className={clsx(
                                            "flex-1 text-left p-4 rounded-xl transition-all border",
                                            selectedEvent?._id === event._id
                                                ? "bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]"
                                                : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                                        )}
                                    >
                                        <div className="font-medium">{event.name}</div>
                                        <div className="text-xs text-slate-400 mt-1">{event.criteria.length} Criteria</div>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEventToDelete(event);
                                        }}
                                        className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-500/50 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {selectedEvent && (
                        <section className="glass rounded-2xl p-6 border border-slate-800">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Users className="text-indigo-400" /> Participants
                            </h2>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newParticipant.name}
                                    onChange={e => setNewParticipant({ ...newParticipant, name: e.target.value })}
                                />
                                <button
                                    onClick={addParticipant}
                                    className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-lg"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {participants.map(p => (
                                    <div key={p._id} className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                                        <div>
                                            <div className="text-sm font-medium">{p.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{p.status}</div>
                                        </div>
                                        {p.status === 'pending' && (
                                            <button
                                                onClick={() => startScoring(p)}
                                                className="p-1.5 rounded-full hover:bg-slate-800 text-indigo-400"
                                                title="Start Scoring"
                                            >
                                                <Play size={16} />
                                            </button>
                                        )}
                                        {p.status === 'completed' && <CheckCircle size={16} className="text-emerald-500" />}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Live Tracking */}
                <div className="lg:col-span-2 space-y-6">
                    {activeParticipant ? (
                        <section className="premium-gradient rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest">Live Now</span>
                                        <h2 className="text-4xl font-black mt-2">{activeParticipant.name}</h2>
                                        <p className="text-indigo-100 mt-1">{selectedEvent.name}</p>
                                    </div>
                                    <button
                                        onClick={recordMarks}
                                        disabled={judgeSubmissions.length === 0}
                                        className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                                    >
                                        Record Marks
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Submission Status List would go here - for now placeholders or actual status */}
                                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                                        <h3 className="text-sm font-semibold mb-3">Judges Status</h3>
                                        <div className="space-y-3">
                                            {judgeSubmissions.length > 0 ? (
                                                judgeSubmissions.map((s, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                                                        <span className="text-sm font-medium">{s.judgeName || `Judge ${s.judgeId}`}</span>
                                                        <span className="ml-auto text-xs font-bold text-emerald-200">{s.totalScore}/10</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-indigo-200 text-xs flex items-center gap-2">
                                                    <Clock size={14} className="animate-spin" /> Waiting for submissions...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                        </section>
                    ) : (
                        <section className="glass rounded-3xl p-20 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-800">
                            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
                                <Play className="text-slate-600 ml-1" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-300">No Active Participant</h3>
                            <p className="text-slate-500 mt-2 max-w-xs">Select an event and click the play icon next to a participant to start live scoring.</p>
                        </section>
                    )}

                    {/* Mini Leaderboard Area */}
                    {selectedEvent && (
                        <section className="glass rounded-2xl p-6 border border-slate-800">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">Live Leaderboard</h2>
                                <Link
                                    href={`/admin/leaderboard?eventId=${selectedEvent._id}`}
                                    className="text-indigo-400 text-sm font-medium flex items-center gap-1 hover:text-indigo-300"
                                >
                                    Full View <ChevronRight size={16} />
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {participants.filter(p => p.status === 'completed').sort((a, b) => b.averageScore - a.averageScore).slice(0, 5).map((p, idx) => (
                                    <div key={p._id} className="flex items-center gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                                        <div className={clsx(
                                            "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                                            idx === 0 ? "bg-amber-500/20 text-amber-500" :
                                                idx === 1 ? "bg-slate-300/20 text-slate-300" :
                                                    idx === 2 ? "bg-orange-500/20 text-orange-500" :
                                                        "bg-slate-800 text-slate-500"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div className="font-semibold">{p.name}</div>
                                        <div className="ml-auto flex items-center gap-2">
                                            <span className="text-2xl font-black text-slate-100">{p.averageScore}</span>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AVG</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Create Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Event Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Solo Dance"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newEvent.name}
                                    onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Criteria (Comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="Expression, Costume, Confidence"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onChange={e => {
                                        const list = e.target.value.split(',').map(s => ({ name: s.trim(), maxScore: 10 }));
                                        setNewEvent({ ...newEvent, criteria: list });
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createEvent}
                                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {eventToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-6 text-rose-500">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-white">Delete Event?</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            This will permanently delete <span className="text-white font-bold">"{eventToDelete.name}"</span> and all associated participants and judge scores. This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setEventToDelete(null)}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteEvent}
                                className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-lg shadow-rose-900/20"
                            >
                                Delete Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
