'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useSWR from 'swr';
import axios from '@/lib/axios';
import Link from 'next/link';
import { useClassroom } from '@/context/ClassroomContext';

const AttendanceBadge = ({ status }) => {
    const map = {
        hadir: { cls: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 shadow-[0_0_8px_rgba(16,185,129,0.06)]', dot: 'bg-emerald-400' },
        sakit: { cls: 'bg-blue-950/40 text-blue-400 border-blue-900/40', dot: 'bg-blue-400' },
        izin:  { cls: 'bg-amber-950/40 text-amber-400 border-amber-900/40', dot: 'bg-amber-400' },
        alpa:  { cls: 'bg-red-950/40 text-red-400 border-red-900/40', dot: 'bg-red-400' },
    };
    const m = map[status] || map.alpa;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${m.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
            {status}
        </span>
    );
};

export default function AttendanceDashboard() {
    const { user } = useAuth();
    const { activeClassId } = useClassroom();
    
    const { data: sessions, mutate } = useSWR(
        activeClassId ? `/api/attendance/session?classroom_id=${activeClassId}` : null,
        () => axios.get(`/api/attendance/session?classroom_id=${activeClassId}`).then(res => res.data)
    );

    const [meetingNumber, setMeetingNumber] = useState('');
    const [topic, setTopic] = useState('');
    const [errors, setErrors] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [activeLogSession, setActiveLogSession] = useState(null);
    const [notesOverride, setNotesOverride] = useState('');

    const { data: logDetails, mutate: mutateLogs } = useSWR(
        activeLogSession ? `/api/attendance/session/${activeLogSession.id}` : null,
        () => axios.get(`/api/attendance/session/${activeLogSession.id}`).then(res => res.data)
    );

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        setErrors([]);
        try {
            await axios.post('/api/attendance/session', {
                classroom_id: activeClassId,
                meeting_number: parseInt(meetingNumber),
                topic,
            });
            setMeetingNumber(''); setTopic('');
            mutate();
            setShowForm(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(Object.values(error.response.data.errors).flat());
            } else {
                setErrors(['Gagal membuka sesi presensi pertemuan.']);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleOverrideStatus = async (attendanceId, status) => {
        try {
            await axios.post(`/api/attendance/${attendanceId}/manual`, { status, notes: notesOverride });
            mutateLogs();
            setNotesOverride('');
        } catch (error) {
            alert('Gagal memperbarui status absensi mahasiswa.');
        }
    };

    const handleToggleSession = async (session) => {
        try {
            await axios.post(`/api/attendance/session/${session.id}/toggle`);
            mutate();
            if (activeLogSession?.id === session.id) mutateLogs();
        } catch (error) {
            console.warn('Toggle error:', error);
        }
    };

    const stats = logDetails?.attendances ? {
        hadir: logDetails.attendances.filter(a => a.status === 'hadir').length,
        sakit: logDetails.attendances.filter(a => a.status === 'sakit').length,
        izin:  logDetails.attendances.filter(a => a.status === 'izin').length,
        alpa:  logDetails.attendances.filter(a => a.status === 'alpa').length,
        total: logDetails.attendances.length
    } : null;

    const activeSessions = sessions?.filter(s => s.is_active).length || 0;

    return (
        <div className="space-y-8 pb-8">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-zinc-800/50 pb-6 animate-fade-in">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.08)]">
                            <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Presensi Kehadiran</h2>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed pl-11.5">
                        Monitoring kehadiran tatap muka real-time dengan sistem QR Code dinamis anti-fraud.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                    {user?.role === 'mahasiswa' && (
                        <Link
                            href="/dashboard/attendance/scan"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-950 bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-zinc-100 border-t border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-white/10 cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            Pindai QR Absensi
                        </Link>
                    )}
                    {user?.role === 'dosen' && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                showForm
                                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                    : 'bg-gradient-to-b from-white to-zinc-200 text-zinc-950 hover:from-white hover:to-zinc-100 border-t border-white/30 shadow-lg shadow-white/10 hover:scale-[1.02]'
                            }`}
                        >
                            <svg className={`w-3.5 h-3.5 transition-transform ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            {showForm ? 'Batal' : 'Buka Sesi Baru'}
                        </button>
                    )}
                </div>
            </div>

            {/* Quick stats */}
            {sessions && sessions.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in delay-100">
                    {[
                        { label: 'Total Sesi', value: sessions.length, color: 'text-zinc-300' },
                        { label: 'Sesi Aktif', value: activeSessions, color: 'text-emerald-400', glow: true },
                        { label: 'Sesi Ditutup', value: sessions.length - activeSessions, color: 'text-zinc-500' },
                        { label: 'Pertemuan', value: sessions.length, color: 'text-blue-400' },
                    ].map((s, i) => (
                        <div key={i} className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-4 text-center">
                            <p className={`text-3xl font-black font-mono tabular-nums ${s.color}`}>{s.value}</p>
                            <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Lecturer create session form */}
            {user?.role === 'dosen' && showForm && (
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-xl animate-scale-in">
                    <div className="flex items-center gap-3 p-6 border-b border-zinc-800/50">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Buka Sesi Presensi Baru</h3>
                    </div>
                    <div className="p-6">
                        {errors.length > 0 && (
                            <div className="mb-4 bg-red-950/20 border border-red-800/40 text-red-400 px-4 py-3.5 rounded-2xl text-xs space-y-1">
                                {errors.map((err, i) => (
                                    <p key={i} className="flex items-center gap-1.5">
                                        <span className="h-1 w-1 bg-red-400 rounded-full" />{err}
                                    </p>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pertemuan Ke-</label>
                                <input
                                    type="number" required min="1" max="16" value={meetingNumber}
                                    onChange={(e) => setMeetingNumber(e.target.value)}
                                    placeholder="1"
                                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-center text-lg font-black font-mono focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Topik Pertemuan</label>
                                <input
                                    type="text" required value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Arsitektur SPA & Client Side Routing"
                                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all duration-300"
                                />
                            </div>
                            <button
                                type="submit" disabled={isCreating}
                                className="py-4 bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-zinc-100 text-zinc-950 font-bold rounded-2xl text-sm tracking-wide transition-all duration-300 shadow-2xl shadow-white/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
                            >
                                {isCreating ? <><div className="h-4 w-4 border-2 border-zinc-400/30 border-t-zinc-700 rounded-full animate-spin" />Membuka...</> : 'Mulai Absensi'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Sessions list */}
            <div className="space-y-4 animate-fade-in delay-200">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-800/50" />
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Daftar Pertemuan Absensi</p>
                    <div className="h-px flex-1 bg-zinc-800/50" />
                </div>

                {!sessions ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-zinc-800/50 rounded-3xl">
                        <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-zinc-400">Belum Ada Sesi Absensi</p>
                            <p className="text-xs text-zinc-600 mt-1">Dosen belum membuka sesi presensi untuk kelas ini.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session, idx) => (
                            <div key={session.id} className={`border rounded-2xl transition-all duration-300 animate-fade-in ${
                                session.is_active ? 'border-emerald-900/40 bg-emerald-950/10' : 'border-zinc-800/40 bg-zinc-900/20'
                            }`} style={{ animationDelay: `${idx * 60}ms` }}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
                                    <div className="flex items-center gap-4">
                                        {/* Meeting number badge */}
                                        <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex flex-col items-center justify-center border ${
                                            session.is_active ? 'bg-emerald-950/40 border-emerald-900/40' : 'bg-zinc-800/40 border-zinc-700/30'
                                        }`}>
                                            <span className={`text-xl font-black font-mono leading-none ${session.is_active ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                                {session.meeting_number}
                                            </span>
                                            <span className="text-[7px] font-bold uppercase text-zinc-600">TM</span>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-black text-white text-sm">{session.topic}</h4>
                                                {session.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-600 border border-zinc-800">Ditutup</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-600 font-mono">
                                                {session.user?.name} • {new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                                        {user?.role === 'dosen' && session.is_active && (
                                            <Link
                                                href={`/dashboard/attendance/session?id=${session.id}`}
                                                className="flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                                Proyektor QR
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => setActiveLogSession(activeLogSession?.id === session.id ? null : session)}
                                            className="px-3.5 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                        >
                                            {activeLogSession?.id === session.id ? 'Tutup Log' : 'Log Presensi'}
                                        </button>
                                        {user?.role === 'dosen' && (
                                            <button
                                                onClick={() => handleToggleSession(session)}
                                                className={`px-3.5 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl border transition-all duration-300 active:scale-[0.98] cursor-pointer ${
                                                    session.is_active
                                                        ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400'
                                                        : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-950/40'
                                                }`}
                                            >
                                                {session.is_active ? 'Tutup Sesi' : 'Buka Kembali'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Presence log details */}
                                {activeLogSession?.id === session.id && (
                                    <div className="border-t border-zinc-800/50 p-5 space-y-5 animate-slide-in-up">
                                        {/* Stats bar */}
                                        {stats && (
                                            <div className="grid grid-cols-4 gap-3">
                                                {[
                                                    { label: 'Hadir', val: stats.hadir, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900/40' },
                                                    { label: 'Sakit', val: stats.sakit, color: 'text-blue-400',    bg: 'bg-blue-950/30 border-blue-900/40' },
                                                    { label: 'Izin',  val: stats.izin,  color: 'text-amber-400',   bg: 'bg-amber-950/30 border-amber-900/40' },
                                                    { label: 'Alpa',  val: stats.alpa,  color: 'text-red-400',     bg: 'bg-red-950/30 border-red-900/40' },
                                                ].map((s, i) => (
                                                    <div key={i} className={`${s.bg} border rounded-xl p-3 text-center`}>
                                                        <p className={`text-2xl font-black font-mono ${s.color}`}>{s.val}</p>
                                                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{s.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {!logDetails ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)}
                                            </div>
                                        ) : logDetails.attendances?.length === 0 ? (
                                            <p className="text-xs text-zinc-600 text-center py-8">Belum ada data absensi mahasiswa masuk.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {logDetails.attendances.map((att) => {
                                                    const scannedAt = att.scanned_at
                                                        ? new Date(att.scanned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                                        : null;

                                                    return (
                                                        <div key={att.id} className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl space-y-3 hover:border-zinc-700/60 transition-colors">
                                                            <div className="flex justify-between items-start">
                                                                <div className="space-y-0.5">
                                                                    <p className="font-bold text-white text-sm leading-tight">{att.user?.name}</p>
                                                                    <p className="text-[10px] text-zinc-600 font-mono">{att.user?.nim_nip}</p>
                                                                </div>
                                                                <AttendanceBadge status={att.status} />
                                                            </div>

                                                            <div className="flex justify-between items-center text-[10px] text-zinc-600 border-t border-zinc-800/50 pt-2">
                                                                <span className="font-mono">QR: {scannedAt ? `${scannedAt} WIB` : '—'}</span>
                                                                {att.notes && <span className="italic truncate max-w-[140px]">"{att.notes}"</span>}
                                                            </div>

                                                            {user?.role === 'dosen' && (
                                                                <div className="flex items-center gap-1.5 border-t border-zinc-800/50 pt-3">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Catatan..."
                                                                        value={notesOverride}
                                                                        onChange={(e) => setNotesOverride(e.target.value)}
                                                                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-zinc-700 placeholder-zinc-700 font-medium"
                                                                    />
                                                                    {['hadir', 'sakit', 'izin'].map(s => {
                                                                        const clr = s === 'hadir' ? 'emerald' : s === 'sakit' ? 'blue' : 'amber';
                                                                        return (
                                                                            <button key={s} onClick={() => handleOverrideStatus(att.id, s)}
                                                                                className={`px-2 py-1.5 bg-${clr}-950/30 hover:bg-${clr}-950/60 text-${clr}-400 rounded-lg text-[9px] font-black uppercase tracking-wider border border-${clr}-900/40 transition-colors cursor-pointer`}
                                                                            >{s}</button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
