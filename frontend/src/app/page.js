'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
    const { login } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/dashboard',
    });

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await login({ email, password, setErrors, setStatus: () => {} });
        setIsSubmitting(false);
    };

    return (
        <div className="flex min-h-screen bg-[#09090b] text-zinc-100 overflow-hidden relative">
            {/* === LEFT PANEL — Visual Brand === */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
                {/* Layered background */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03) 0%, transparent 50%),
                                      radial-gradient(circle at 80% 80%, rgba(255,255,255,0.02) 0%, transparent 50%)`
                }} />
                {/* Fine grid overlay */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }} />

                {/* Decorative orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-[80px] pointer-events-none" />

                {/* Top header */}
                <div className="relative z-10 flex items-center gap-3 animate-fade-in">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-zinc-200 to-white flex items-center justify-center shadow-lg">
                        <span className="text-zinc-950 font-black text-base tracking-tighter">U</span>
                    </div>
                    <div>
                        <p className="text-sm font-black text-white tracking-tight">UTN Indonesia</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Universitas Teknologi Nusantara</p>
                    </div>
                </div>

                {/* Center hero content */}
                <div className="relative z-10 space-y-8 animate-slide-in-up delay-200">
                    {/* Large decorative icon */}
                    <div className="relative w-20 h-20 animate-float">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-600/30 shadow-2xl flex items-center justify-center">
                            <svg className="w-9 h-9 text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                            </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow-[0_0_8px_#10b981]" />
                    </div>

                    <div className="space-y-4 max-w-sm">
                        <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
                            Portal Akademik<br />
                            <span className="gradient-text-bright">Terpadu UTN</span>
                        </h1>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Platform manajemen pembelajaran terintegrasi untuk mendukung proses belajar mengajar di Universitas Teknologi Nusantara.
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-3">
                        {[
                            { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Materi & Modul Kuliah Digital' },
                            { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Sistem Tugas & Penilaian Online' },
                            { icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-16v3m0 0h.01M4 12H2m10 0h2m-2-8a4 4 0 11-8 0 4 4 0 018 0zM16 12a4 4 0 11-8 0 4 4 0 018 0z', label: 'Absensi QR Code Anti-Fraud' },
                        ].map((item, i) => (
                            <div key={i} className={`flex items-center gap-3 animate-fade-in delay-${(i + 3) * 100}`}>
                                <div className="h-8 w-8 rounded-lg bg-zinc-800/60 border border-zinc-700/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                    </svg>
                                </div>
                                <span className="text-xs text-zinc-400 font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom footer */}
                <div className="relative z-10 animate-fade-in delay-500">
                    <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                        © 2026 UTN Indonesia — Sistem Informasi Akademik
                    </p>
                </div>
            </div>

            {/* === RIGHT PANEL — Login Form === */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 relative">
                {/* Subtle right panel bg */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 to-black" />
                <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full bg-white/[0.015] blur-[120px] pointer-events-none" />

                <div className="relative z-10 w-full max-w-sm space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2.5 animate-fade-in">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-zinc-200 to-white flex items-center justify-center shadow-lg">
                            <span className="text-zinc-950 font-black text-base">U</span>
                        </div>
                        <div>
                            <p className="text-sm font-black text-white">UTN Indonesia</p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Universitas Teknologi Nusantara</p>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="space-y-2 animate-fade-in delay-100">
                        <h2 className="text-2xl font-black text-white tracking-tight">Masuk ke Akun</h2>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Gunakan kredensial institusi Anda untuk mengakses portal akademik.
                        </p>
                    </div>

                    {/* Error alert */}
                    {errors.length > 0 && (
                        <div className="bg-red-950/30 border border-red-800/40 text-red-400 px-4 py-4 rounded-2xl text-xs space-y-1.5 animate-scale-in">
                            <p className="font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 bg-red-400 rounded-full inline-block" />
                                Kesalahan Autentikasi
                            </p>
                            {errors.map((error, index) => (
                                <p key={index} className="text-red-300/80">{error}</p>
                            ))}
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-5 animate-fade-in delay-200" onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                Alamat Email Institusi
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-zinc-400 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 text-white placeholder-zinc-600 text-sm transition-all duration-300 font-medium"
                                    placeholder="contoh@utn.ac.id"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                Kata Sandi
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-zinc-400 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 text-white placeholder-zinc-600 text-sm transition-all duration-300 font-medium"
                                    placeholder="••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-4 flex items-center text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="relative w-full py-4 rounded-2xl text-sm font-bold tracking-wide text-zinc-950 bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-zinc-100 border-t border-white/30 transition-all duration-300 shadow-2xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-zinc-500/40 border-t-zinc-950 rounded-full animate-spin" />
                                        Memverifikasi Sesi...
                                    </>
                                ) : (
                                    <>
                                        Masuk Portal Akademik
                                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="pt-4 border-t border-zinc-900 animate-fade-in delay-300">
                        <p className="text-[10px] text-zinc-600 text-center font-mono uppercase tracking-widest">
                            UTN Indonesia • Sistem Informasi Akademik Terpadu
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
