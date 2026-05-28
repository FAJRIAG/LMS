'use client';

import { useAuth } from '@/hooks/useAuth';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { useClassroom } from '@/context/ClassroomContext';
import Link from 'next/link';

const StatCard = ({ label, value, desc, color, icon, href, delay }) => {
    const colorMap = {
        blue:    { dot: '#3b82f6', glow: '#3b82f620', badge: 'bg-blue-950/30 text-blue-400 border-blue-900/40' },
        amber:   { dot: '#f59e0b', glow: '#f59e0b20', badge: 'bg-amber-950/30 text-amber-400 border-amber-900/40' },
        emerald: { dot: '#10b981', glow: '#10b98120', badge: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' },
    };
    const c = colorMap[color];

    return (
        <Link href={href} className={`group block bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/60 rounded-3xl p-6 hover:border-zinc-700/60 hover:bg-zinc-900/50 transition-all duration-400 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-950/80 relative overflow-hidden animate-fade-in delay-${delay}`}>
            {/* Glow orb */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: c.glow, transform: 'translate(30%, -30%)' }} />
            
            <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-2xl bg-zinc-800/60 border border-zinc-700/30 flex items-center justify-center group-hover:border-zinc-600/40 transition-colors">
                        <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
                        </svg>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shadow-lg" style={{ background: c.dot, boxShadow: `0 0 8px ${c.dot}` }} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live</span>
                    </div>
                </div>

                <div>
                    <p className="text-5xl font-black text-white font-mono tracking-tight tabular-nums">
                        {value !== undefined && value !== null ? String(value).padStart(2, '0') : '—'}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">{label}</p>
                </div>
                
                <p className="text-xs text-zinc-600 leading-relaxed group-hover:text-zinc-500 transition-colors">{desc}</p>
                
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    <span>Lihat Detail</span>
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    );
};

export default function DashboardHome() {
    const { user } = useAuth();
    const { activeClassId } = useClassroom();
    
    const { data: materials } = useSWR(
        activeClassId ? `/api/materials?classroom_id=${activeClassId}` : null,
        () => axios.get(`/api/materials?classroom_id=${activeClassId}`).then(res => res.data)
    );
    const { data: assignments } = useSWR(
        activeClassId ? `/api/assignments?classroom_id=${activeClassId}` : null,
        () => axios.get(`/api/assignments?classroom_id=${activeClassId}`).then(res => res.data)
    );
    const { data: sessions } = useSWR(
        activeClassId ? `/api/attendance/session?classroom_id=${activeClassId}` : null,
        () => axios.get(`/api/attendance/session?classroom_id=${activeClassId}`).then(res => res.data)
    );

    // Compute pending assignments for students
    const pendingAssignments = user?.role === 'mahasiswa'
        ? assignments?.filter(a => !a.submissions?.length && new Date() < new Date(a.deadline_at)).length
        : null;

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Selamat Pagi' : currentHour < 17 ? 'Selamat Siang' : 'Selamat Malam';

    // Ambil nama panggilan — lewati gelar seperti "Dr.", "Prof.", "M.T.", dll.
    const titlePrefixes = new Set(['dr.', 'dr', 'prof.', 'prof', 'ir.', 'ir', 'drs.', 'drs', 'hj.', 'hj', 'h.']);
    const nameParts = user?.name?.split(' ') || [];
    const firstName = nameParts.find(w => !titlePrefixes.has(w.toLowerCase()) && !w.endsWith('.') && w.length > 1)
        || nameParts[nameParts.length - 1]
        || user?.name;

    return (
        <div className="space-y-8 pb-8">
            {/* ===== GREETING HERO BANNER ===== */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 via-zinc-900 to-zinc-950 p-8 lg:p-10 shadow-2xl animate-fade-in">
                {/* Background texture */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                    backgroundSize: '28px 28px'
                }} />
                <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-white/[0.02] blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                {greeting}
                            </span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                            {user?.name}<span className="text-zinc-500">,</span><br />
                            <span className="gradient-text-bright text-2xl lg:text-3xl">
                                {user?.role === 'dosen' ? 'Dosen Pengampu' : 'Mahasiswa Aktif'}
                            </span>
                        </h2>
                        <p className="text-zinc-500 text-sm max-w-md leading-relaxed">
                            {user?.role === 'dosen'
                                ? 'Kelola distribusi materi, tugas mahasiswa, dan monitoring presensi kelas secara real-time.'
                                : 'Akses materi kuliah, kumpulkan tugas tepat waktu, dan verifikasi kehadiran kelas dengan QR absensi.'}
                        </p>
                    </div>

                    {/* Quick action */}
                    {user?.role === 'mahasiswa' && pendingAssignments > 0 && (
                        <Link href="/dashboard/assignments" className="group flex-shrink-0 flex items-center gap-4 bg-zinc-800/50 border border-zinc-700/40 rounded-2xl p-5 hover:bg-zinc-800 hover:border-zinc-600/60 transition-all duration-300 max-w-xs">
                            <div className="h-12 w-12 rounded-xl bg-amber-950/40 border border-amber-900/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.08)]">
                                <span className="text-2xl font-black text-amber-400 font-mono">{pendingAssignments}</span>
                            </div>
                            <div>
                                <p className="text-xs font-black text-white">Tugas Menunggu</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Segera kumpulkan sebelum tenggat</p>
                            </div>
                            <svg className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </Link>
                    )}
                </div>
            </div>

            {/* ===== STATS GRID ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard
                    label="Materi Kuliah"
                    value={materials?.length}
                    desc="Berkas modul kuliah aktif yang dapat diakses dan diunduh"
                    color="blue"
                    icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    href="/dashboard/materials"
                    delay={100}
                />
                <StatCard
                    label="Tugas & Evaluasi"
                    value={assignments?.length}
                    desc="Total tugas yang diterbitkan dalam kelas aktif semester ini"
                    color="amber"
                    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    href="/dashboard/assignments"
                    delay={200}
                />
                <StatCard
                    label="Pertemuan Sesi"
                    value={sessions?.length}
                    desc="Log absensi kehadiran tatap muka yang terdaftar semester ini"
                    color="emerald"
                    icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    href="/dashboard/attendance"
                    delay={300}
                />
            </div>

            {/* ===== GUIDANCE SECTION ===== */}
            <div className="animate-fade-in delay-400">
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-zinc-800/60" />
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Panduan Penggunaan Portal</p>
                    <div className="h-px flex-1 bg-zinc-800/60" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(user?.role === 'dosen' ? [
                        {
                            num: '01',
                            title: 'Distribusi Materi & Tugas',
                            desc: 'Unggah berkas silabus (.pdf, .pptx, .docx) dan buat tugas dengan tenggat waktu presisi untuk setiap kelas yang Anda ampu.',
                            icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
                            href: '/dashboard/materials',
                        },
                        {
                            num: '02',
                            title: 'Absensi QR & Penilaian',
                            desc: 'Buka sesi absensi virtual, tampilkan QR Code dinamis anti-fraud di proyektor kelas, dan nilai lembar jawaban mahasiswa.',
                            icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-16v3m0 0h.01M4 12H2m10 0h2m-2-8a4 4 0 11-8 0 4 4 0 018 0zM16 12a4 4 0 11-8 0 4 4 0 018 0z',
                            href: '/dashboard/attendance',
                        },
                    ] : [
                        {
                            num: '01',
                            title: 'Akses Materi & Kumpul Tugas',
                            desc: 'Unduh modul dari dosen pengampu dan kumpulkan lembar jawaban (.pdf, .docx, .zip) sebelum tenggat waktu berakhir.',
                            icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                            href: '/dashboard/materials',
                        },
                        {
                            num: '02',
                            title: 'Verifikasi Absensi QR',
                            desc: 'Akses kamera scanner presensi di browser HP dan pindai kode QR dinamis dari layar proyektor dosen untuk verifikasi kehadiran.',
                            icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
                            href: '/dashboard/attendance',
                        },
                    ]).map((item, i) => (
                        <Link key={i} href={item.href} className={`group flex gap-5 bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/60 rounded-2xl p-6 transition-all duration-300 animate-fade-in delay-${400 + i * 100}`}>
                            <div className="flex-shrink-0">
                                <span className="text-4xl font-black text-zinc-800 group-hover:text-zinc-700 transition-colors font-mono tabular-nums">{item.num}</span>
                            </div>
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-zinc-800/60 border border-zinc-700/30 flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={item.icon} />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-black text-white group-hover:text-zinc-100 transition-colors">{item.title}</h4>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">{item.desc}</p>
                            </div>
                            <div className="self-center flex-shrink-0 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
