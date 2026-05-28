'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { ClassroomProvider, useClassroom } from '@/context/ClassroomContext';

const navItems = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        exact: true,
    },
    {
        name: 'Materi Kuliah',
        href: '/dashboard/materials',
        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        color: 'blue',
    },
    {
        name: 'Tugas Kelas',
        href: '/dashboard/assignments',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        color: 'amber',
    },
    {
        name: 'Presensi Sesi',
        href: '/dashboard/attendance',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'emerald',
    },
    {
        name: 'Anggota Kelas',
        href: '/dashboard/students',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        color: 'purple',
    },
];

const colorMap = {
    blue:    'bg-blue-500 shadow-[0_0_8px_#3b82f6]',
    amber:   'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
    emerald: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
    purple:  'bg-purple-500 shadow-[0_0_8px_#a855f7]',
};

function DashboardContent({ children }) {
    const { user, logout, isLoading } = useAuth({ middleware: 'auth' });
    const { activeClassId, changeClass } = useClassroom();
    const pathname = usePathname();

    if (isLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">
                <div className="text-center space-y-4">
                    <div className="relative h-10 w-10 mx-auto">
                        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-zinc-400 animate-spin" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Memverifikasi sesi...</p>
                </div>
            </div>
        );
    }

    const classrooms = user.role === 'dosen' ? user.taught_classrooms : user.classrooms;
    const departments = {};
    if (classrooms) {
        classrooms.forEach(classroom => {
            const deptName = classroom.department?.name || 'Lainnya';
            if (!departments[deptName]) departments[deptName] = [];
            departments[deptName].push(classroom);
        });
    }

    const initials = user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

    return (
        <div className="flex min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
            {/* Global ambient background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-white/[0.015] blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/[0.01] blur-[100px]" />
            </div>

            {/* ===== SIDEBAR ===== */}
            <aside className="w-60 xl:w-64 bg-zinc-950/80 backdrop-blur-2xl border-r border-zinc-800/40 flex flex-col shrink-0 relative z-20 overflow-hidden">
                {/* Subtle inner glow */}
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.01] blur-[60px] pointer-events-none" />

                <div className="flex flex-col h-full relative z-10">
                    {/* Brand header */}
                    <div className="p-5 border-b border-zinc-800/40">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-zinc-200 to-white flex items-center justify-center shadow-lg flex-shrink-0">
                                <span className="text-zinc-950 font-black text-sm tracking-tighter">U</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-black text-white tracking-tight leading-none truncate">UTN Indonesia</p>
                                <p className="text-[8px] font-bold tracking-widest text-zinc-600 uppercase mt-0.5 truncate">Universitas Teknologi Nusantara</p>
                            </div>
                        </div>
                    </div>

                    {/* User profile card */}
                    <div className="p-4">
                        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-3.5 space-y-2.5 hover:border-zinc-700/60 transition-colors duration-300">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-zinc-700 to-zinc-600 border border-zinc-600/30 flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-inner">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <p className="text-xs font-bold text-white truncate leading-tight" title={user.name}>{user.name}</p>
                                    <p className="text-[9px] text-zinc-500 font-mono truncate">{user.nim_nip}</p>
                                </div>
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                                {user.role === 'dosen' ? 'Dosen Pengampu' : 'Mahasiswa'}
                            </span>
                        </div>
                    </div>

                    {/* Class selector */}
                    {classrooms && classrooms.length > 0 && (
                        <div className="px-4 pb-3">
                            <label className="block text-[9px] text-zinc-600 uppercase font-black tracking-wider mb-1.5">
                                {user.role === 'dosen' ? 'Kelas Kerja' : 'Kelas Aktif'}
                            </label>
                            <div className="relative">
                                <select
                                    value={activeClassId || ''}
                                    onChange={(e) => changeClass(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-zinc-700 cursor-pointer appearance-none transition-all duration-300 hover:border-zinc-700"
                                >
                                    {Object.keys(departments).map(deptName => (
                                        <optgroup key={deptName} label={deptName} className="bg-zinc-900 text-zinc-400">
                                            {departments[deptName].map(cls => {
                                                const subjectName = cls.pivot?.subject_name || cls.lecturers?.[0]?.pivot?.subject_name;
                                                return (
                                                    <option key={cls.id} value={cls.id} className="bg-zinc-950 text-white font-bold">
                                                        {cls.name}{subjectName ? ` (${subjectName})` : ''}
                                                    </option>
                                                );
                                            })}
                                        </optgroup>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-500">
                                    <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 px-3 space-y-0.5">
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest px-2 pb-2">Menu Navigasi</p>
                        {navItems.map((item) => {
                            const active = item.exact
                                ? pathname === item.href
                                : pathname === item.href || pathname.startsWith(item.href + '/');

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                                        active
                                            ? 'bg-zinc-800/80 text-white border border-zinc-700/40 shadow-sm'
                                            : 'text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-300 border border-transparent hover:border-zinc-800/40'
                                    }`}
                                >
                                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                        active ? 'bg-zinc-700/60' : 'bg-transparent group-hover:bg-zinc-800/40'
                                    }`}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                        </svg>
                                    </div>
                                    <span className="truncate">{item.name}</span>
                                    {active && item.color && (
                                        <span className={`ml-auto h-1.5 w-1.5 rounded-full flex-shrink-0 ${colorMap[item.color]}`} />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-zinc-800/40">
                        <button
                            onClick={logout}
                            className="group w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:bg-red-950/20 hover:text-red-400 rounded-xl transition-all duration-200 border border-transparent hover:border-red-900/20 cursor-pointer"
                        >
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-950/30 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            Keluar Sesi
                        </button>
                    </div>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1 flex flex-col min-h-screen relative z-10 overflow-x-hidden">
                {/* Topbar */}
                <header className="h-14 border-b border-zinc-800/40 bg-zinc-950/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-mono uppercase tracking-widest text-[10px]">Sistem Akademik</span>
                        <span className="text-zinc-700">•</span>
                        <span className="font-medium text-zinc-400 truncate max-w-xs">{user.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-500 border border-zinc-800 font-mono">
                            {user.role}
                        </span>
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-700/50 flex items-center justify-center text-xs font-black text-zinc-200 shadow-inner select-none">
                            {initials}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-5xl w-full mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <ClassroomProvider>
            <DashboardContent>{children}</DashboardContent>
        </ClassroomProvider>
    );
}
