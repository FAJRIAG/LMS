'use client';

import { useAuth } from '@/hooks/useAuth';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { useClassroom } from '@/context/ClassroomContext';

export default function Students() {
    const { user } = useAuth();
    const { activeClassId } = useClassroom();

    const { data: students, error, isLoading } = useSWR(
        activeClassId ? `/api/classrooms/${activeClassId}/students` : null,
        () => axios.get(`/api/classrooms/${activeClassId}/students`).then(res => res.data)
    );

    return (
        <div className="space-y-8 pb-8">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-zinc-800/50 pb-6 animate-fade-in">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-purple-950/40 border border-purple-900/40 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.08)]">
                            <svg className="w-4.5 h-4.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Anggota Kelas</h2>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed pl-11.5">
                        Daftar seluruh mahasiswa yang terdaftar dan mengikuti kegiatan di kelas ini.
                    </p>
                </div>
            </div>

            {/* Stats */}
            {students && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in delay-100">
                    <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-zinc-800/50 flex items-center justify-center">
                            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-black font-mono tabular-nums text-white">{students.length}</p>
                            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">Total Mahasiswa</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Students List */}
            <div className="space-y-4 animate-fade-in delay-200">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-800/50" />
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                        Daftar Mahasiswa Terdaftar
                    </p>
                    <div className="h-px flex-1 bg-zinc-800/50" />
                </div>

                {!activeClassId || isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer" />)}
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-red-400 bg-red-950/20 rounded-2xl border border-red-900/30">
                        <p className="text-sm font-bold">Gagal memuat data mahasiswa</p>
                    </div>
                ) : students?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-zinc-800/50 rounded-3xl">
                        <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-zinc-400">Belum Ada Mahasiswa</p>
                            <p className="text-xs text-zinc-600 mt-1">Kelas ini belum memiliki mahasiswa yang terdaftar.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {students.map((student, idx) => {
                            const initials = student.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
                            return (
                                <div 
                                    key={student.id} 
                                    className="group flex items-center gap-4 bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-800/40 hover:border-zinc-700/60 rounded-2xl p-4 transition-all duration-300 animate-fade-in"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Avatar */}
                                    <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-700/50 flex items-center justify-center text-sm font-black text-zinc-200 shadow-inner select-none group-hover:scale-105 transition-transform duration-300">
                                        {initials}
                                    </div>
                                    
                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{student.name}</p>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                </svg>
                                                <span className="text-[11px] font-mono">{student.nim_nip}</span>
                                            </div>
                                            <div className="hidden sm:block text-zinc-600">•</div>
                                            <div className="flex items-center gap-1.5 text-zinc-500">
                                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-[11px] truncate">{student.email}</span>
                                            </div>
                                        </div>
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
