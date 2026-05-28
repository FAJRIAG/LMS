'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useSWR from 'swr';
import axios from '@/lib/axios';
import Link from 'next/link';
import { useClassroom } from '@/context/ClassroomContext';

const StatusBadge = ({ label, variant }) => {
    const variants = {
        submitted: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 shadow-[0_0_8px_rgba(16,185,129,0.06)]',
        overdue:   'bg-red-950/40 text-red-400 border-red-900/40',
        urgent:    'bg-amber-950/40 text-amber-400 border-amber-900/40 animate-pulse',
        pending:   'bg-zinc-900 text-zinc-500 border-zinc-800',
        count:     'bg-zinc-800/60 text-zinc-400 border-zinc-700/40',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${variants[variant]}`}>
            {variant === 'submitted' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            {variant === 'urgent' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />}
            {label}
        </span>
    );
};

export default function Assignments() {
    const { user } = useAuth();
    const { activeClassId } = useClassroom();

    const { data: assignments, mutate } = useSWR(
        activeClassId ? `/api/assignments?classroom_id=${activeClassId}` : null,
        () => axios.get(`/api/assignments?classroom_id=${activeClassId}`).then(res => res.data)
    );

    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [deadline, setDeadline] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [errors, setErrors] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        setErrors([]);

        const formData = new FormData();
        formData.append('classroom_id', activeClassId);
        formData.append('title', title);
        formData.append('instructions', instructions);
        formData.append('deadline_at', deadline);
        if (attachment) formData.append('attachment', attachment);

        try {
            await axios.post('/api/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setTitle(''); setInstructions(''); setDeadline(''); setAttachment(null);
            document.getElementById('attachmentInput').value = '';
            mutate();
            setShowForm(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(Object.values(error.response.data.errors).flat());
            } else {
                setErrors(['Gagal membuat tugas perkuliahan.']);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus tugas ini? Semua data pengumpulan jawaban mahasiswa terkait juga akan dihapus.')) return;
        try {
            await axios.delete(`/api/assignments/${id}`);
            mutate();
        } catch (error) {
            alert('Gagal menghapus tugas perkuliahan.');
        }
    };

    const getDaysUntil = (dateStr) => {
        const diff = new Date(dateStr) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // Stats for lecturer
    const totalSubmissions = assignments?.reduce((acc, a) => acc + (a.submissions_count || 0), 0);
    const gradedCount = assignments?.reduce((acc, a) => acc + (a.submissions?.filter(s => s.grade !== null).length || 0), 0);

    return (
        <div className="space-y-8 pb-8">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-zinc-800/50 pb-6 animate-fade-in">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-amber-950/40 border border-amber-900/40 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.08)]">
                            <svg className="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Tugas Perkuliahan</h2>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed pl-11.5">
                        Kelola evaluasi penugasan, monitor tenggat waktu, dan pantau umpan balik hasil belajar.
                    </p>
                </div>

                {user?.role === 'dosen' && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                            showForm
                                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                : 'bg-gradient-to-b from-white to-zinc-200 text-zinc-950 hover:from-white hover:to-zinc-100 border-t border-white/30 shadow-lg shadow-white/10 hover:scale-[1.02]'
                        }`}
                    >
                        <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        {showForm ? 'Batal' : 'Buat Tugas Baru'}
                    </button>
                )}
            </div>

            {/* Dosen Quick Stats */}
            {user?.role === 'dosen' && assignments && (
                <div className="grid grid-cols-3 gap-4 animate-fade-in delay-100">
                    {[
                        { label: 'Total Tugas', value: assignments.length, color: 'text-zinc-300' },
                        { label: 'Total Pengumpulan', value: totalSubmissions || 0, color: 'text-emerald-400' },
                        { label: 'Belum Dinilai', value: (totalSubmissions || 0) - (gradedCount || 0), color: 'text-amber-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-4 text-center">
                            <p className={`text-3xl font-black font-mono tabular-nums ${stat.color}`}>{stat.value}</p>
                            <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Create form (dosen) */}
            {user?.role === 'dosen' && showForm && (
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-xl animate-scale-in">
                    <div className="flex items-center gap-3 p-6 border-b border-zinc-800/50">
                        <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Buat Penugasan Baru</h3>
                    </div>

                    <div className="p-6 space-y-5">
                        {errors.length > 0 && (
                            <div className="bg-red-950/20 border border-red-800/40 text-red-400 px-4 py-3.5 rounded-2xl text-xs space-y-1 animate-scale-in">
                                {errors.map((error, i) => (
                                    <p key={i} className="flex items-center gap-1.5">
                                        <span className="h-1 w-1 bg-red-400 rounded-full" />{error}
                                    </p>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Judul Tugas</label>
                                    <input
                                        type="text" required value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Contoh: Tugas 1 — Membuat REST API Laravel"
                                        className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 transition-all duration-300 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Batas Waktu (Deadline)</label>
                                    <input
                                        type="datetime-local" required value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 transition-all duration-300 cursor-pointer font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Instruksi & Kriteria Penilaian</label>
                                <textarea
                                    required value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="Jelaskan langkah-langkah pengerjaan tugas secara mendetail..."
                                    className="w-full h-32 px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 transition-all duration-300 resize-none font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Lampiran Pendukung (Opsional)</label>
                                    <div className="border border-zinc-800 rounded-2xl bg-zinc-950 p-3 hover:border-zinc-700 transition-all duration-300">
                                        <input
                                            type="file" id="attachmentInput"
                                            onChange={(e) => setAttachment(e.target.files[0])}
                                            className="w-full text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer text-xs focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit" disabled={isCreating}
                                    className="py-4 bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-zinc-100 text-zinc-950 font-bold rounded-2xl text-sm tracking-wide transition-all duration-300 shadow-2xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <><div className="h-4 w-4 border-2 border-zinc-400/30 border-t-zinc-700 rounded-full animate-spin" />Mempublikasikan...</>
                                    ) : 'Publikasikan Tugas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignments list */}
            <div className="space-y-4 animate-fade-in delay-200">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-800/50" />
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                        {assignments?.length ? `${assignments.length} Evaluasi Tugas` : 'Daftar Evaluasi Tugas'}
                    </p>
                    <div className="h-px flex-1 bg-zinc-800/50" />
                </div>

                {!assignments ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl shimmer" />)}
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-zinc-800/50 rounded-3xl">
                        <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-zinc-400">Belum Ada Tugas</p>
                            <p className="text-xs text-zinc-600 mt-1">Dosen belum menerbitkan penugasan pada kelas ini.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {assignments.map((assignment, idx) => {
                            const deadlineDate = new Date(assignment.deadline_at);
                            const isOverdue = new Date() > deadlineDate;
                            const submission = assignment.submissions?.[0];
                            const isSubmitted = !!submission;
                            const isUrgent = !isSubmitted && !isOverdue && (deadlineDate - new Date() < 24 * 60 * 60 * 1000);
                            const daysUntil = getDaysUntil(assignment.deadline_at);

                            return (
                                <div key={assignment.id} className={`group flex flex-col sm:flex-row sm:items-center gap-5 border rounded-2xl p-5 transition-all duration-300 animate-fade-in ${
                                    isUrgent ? 'bg-amber-950/10 border-amber-900/30 hover:border-amber-900/50' :
                                    isOverdue && !isSubmitted ? 'bg-red-950/10 border-red-900/20 hover:border-red-900/35' :
                                    'bg-zinc-900/20 border-zinc-800/40 hover:bg-zinc-900/40 hover:border-zinc-700/60'
                                }`} style={{ animationDelay: `${idx * 60}ms` }}>
                                    {/* Deadline visual */}
                                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border ${
                                        isOverdue && !isSubmitted ? 'bg-red-950/30 border-red-900/40' :
                                        isUrgent ? 'bg-amber-950/30 border-amber-900/40' :
                                        isSubmitted ? 'bg-emerald-950/30 border-emerald-900/40' :
                                        'bg-zinc-800/40 border-zinc-700/30'
                                    }`}>
                                        {isSubmitted ? (
                                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                            </svg>
                                        ) : (
                                            <>
                                                <span className={`text-lg font-black font-mono tabular-nums leading-none ${
                                                    isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-zinc-400'
                                                }`}>{isOverdue ? '!' : Math.max(0, daysUntil)}</span>
                                                <span className={`text-[8px] font-bold uppercase ${
                                                    isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-zinc-600'
                                                }`}>{isOverdue ? 'lewat' : 'hari'}</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-black text-white text-sm leading-tight">{assignment.title}</h4>
                                            {user?.role === 'dosen' ? (
                                                <StatusBadge label={`${assignment.submissions_count} Masuk`} variant="count" />
                                            ) : isSubmitted ? (
                                                <StatusBadge label="Telah Mengumpul" variant="submitted" />
                                            ) : isOverdue ? (
                                                <StatusBadge label="Terlambat" variant="overdue" />
                                            ) : isUrgent ? (
                                                <StatusBadge label="Segera Kumpul" variant="urgent" />
                                            ) : (
                                                <StatusBadge label="Belum Dikumpul" variant="pending" />
                                            )}
                                            {user?.role === 'mahasiswa' && isSubmitted && submission.grade !== null && (
                                                <StatusBadge label={`Nilai: ${submission.grade}/100`} variant="submitted" />
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed">{assignment.instructions}</p>
                                        <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
                                            <span>{assignment.user?.name}</span>
                                            <span>•</span>
                                            <span className={isOverdue && !isSubmitted ? 'text-red-500 font-bold' : isUrgent ? 'text-amber-500 font-bold' : ''}>
                                                Tenggat: {deadlineDate.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex-shrink-0 self-start sm:self-center flex flex-col sm:flex-row gap-2">
                                        {user?.role === 'dosen' && (
                                            <button
                                                onClick={() => handleDelete(assignment.id)}
                                                className="flex justify-center items-center gap-2 px-4 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-900/40 hover:border-red-700/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                        <Link
                                            href={`/dashboard/assignments/${assignment.id}`}
                                            className="flex justify-center items-center gap-2 px-4 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {user?.role === 'dosen' ? 'Periksa Jawaban' : 'Detail & Unggah'}
                                            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
