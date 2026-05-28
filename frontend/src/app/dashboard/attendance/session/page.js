'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';

function LecturerSessionProjectorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('id');

    const [sessionInfo, setSessionInfo] = useState(null);
    const [qrPayload, setQrPayload] = useState('');
    const [presenceCount, setPresenceCount] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [countdown, setCountdown] = useState(15);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!sessionId) {
            router.push('/dashboard/attendance');
            return;
        }

        // 1. Initial Load of Session Info
        const loadSession = async () => {
            try {
                const response = await axios.get(`/api/attendance/session/${sessionId}`);
                setSessionInfo(response.data);
                
                // Count presence
                const attendances = response.data.attendances || [];
                setTotalStudents(attendances.length);
                setPresenceCount(attendances.filter(a => a.status === 'hadir').length);
            } catch (err) {
                setErrorMsg('Gagal memuat informasi sesi absensi.');
            }
        };

        loadSession();

        // 2. Dynamic Token Refresh Timer (Every 15 Seconds)
        const fetchNewToken = async () => {
            try {
                const response = await axios.get(`/api/attendance/session/${sessionId}/refresh`);
                setQrPayload(response.data.qr_payload);
                setCountdown(15); // Reset countdown
            } catch (err) {
                console.warn('Refresh token error:', err);
            }
        };

        fetchNewToken();
        const refreshInterval = setInterval(fetchNewToken, 15000);

        // 3. Presence counter update polling (Every 5 seconds)
        const pollPresence = async () => {
            try {
                const response = await axios.get(`/api/attendance/session/${sessionId}`);
                const attendances = response.data.attendances || [];
                setTotalStudents(attendances.length);
                setPresenceCount(attendances.filter(a => a.status === 'hadir').length);
            } catch (err) {
                console.warn('Polling error:', err);
            }
        };
        const pollInterval = setInterval(pollPresence, 5000);

        // 4. Visual timer ticker (Every 1 second)
        const countdownInterval = setInterval(() => {
            setCountdown(prev => (prev > 1 ? prev - 1 : 15));
        }, 1000);

        return () => {
            clearInterval(refreshInterval);
            clearInterval(pollInterval);
            clearInterval(countdownInterval);
        };
    }, [sessionId, router]);

    if (errorMsg) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-4 selection:bg-zinc-800 selection:text-white">
                <p className="font-mono text-sm">{errorMsg}</p>
                <Link href="/dashboard/attendance" className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-750 text-xs font-bold rounded-xl transition-all">
                    Kembali Ke Dasbor
                </Link>
            </div>
        );
    }

    if (!sessionInfo) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400 font-mono text-xs">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400 mx-auto"></div>
                    <p>Menyinkronkan proyektor kelas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-8 sm:p-12 selection:bg-zinc-800 selection:text-white relative overflow-hidden">
            {/* Visual background blurs */}
            <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] rounded-full bg-zinc-800/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-25%] right-[-15%] w-[600px] h-[600px] rounded-full bg-zinc-800/15 blur-[130px] pointer-events-none" />

            {/* Top Navigation */}
            <header className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-850 pb-6 gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                            UTN Indonesia Presence Projector
                        </h1>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                    </div>
                    <p className="text-zinc-500 text-xs leading-normal">
                        Mata Kuliah Silabus Terintegrasi • Topik: <strong className="text-zinc-300 font-medium">{sessionInfo.topic}</strong>
                    </p>
                </div>
                <div className="self-start sm:self-center">
                    <span className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold font-mono text-zinc-300">
                        Pertemuan Ke-{sessionInfo.meeting_number}
                    </span>
                </div>
            </header>

            {/* Main Projector QR Space */}
            <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-16 py-12">
                
                {/* QR Display Card */}
                <div className="bg-zinc-900/40 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center shadow-2xl relative group overflow-hidden transition-all duration-500 hover:border-zinc-700">
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-zinc-800/10 blur-[45px] pointer-events-none" />
                    
                    <div className="p-6 bg-white rounded-2xl border-4 border-zinc-950 flex items-center justify-center relative shadow-inner">
                        {qrPayload ? (
                            <QRCodeCanvas
                                value={qrPayload}
                                size={300}
                                level="H"
                                includeMargin={false}
                                className="bg-white"
                            />
                        ) : (
                            <div className="h-[300px] w-[300px] flex items-center justify-center text-zinc-400 text-xs italic font-mono">
                                Membuat token tanda presensi...
                            </div>
                        )}
                    </div>

                    {/* Expiry indicator bar */}
                    <div className="w-full mt-6 bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850 p-0.5">
                        <div 
                            className="h-full bg-gradient-to-r from-zinc-500 to-zinc-100 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                            style={{ width: `${(countdown / 15) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Live presence count & description */}
                <div className="space-y-8 max-w-md text-center lg:text-left">
                    <div className="space-y-3">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-800">
                            Algoritma Time-Based Cryptographic
                        </span>
                        <h2 className="text-3xl font-black text-white tracking-tight leading-none">Pindai Tanda Presensi</h2>
                        <p className="text-zinc-450 text-sm leading-relaxed">
                            Kode QR di samping diperbarui secara kriptografis setiap <strong className="text-zinc-200 font-medium">15 detik</strong>. Pindai absensi menggunakan kamera HP browser mahasiswa yang sah untuk verifikasi kehadiran.
                        </p>
                    </div>

                    {/* Counter Widget */}
                    <div className="grid grid-cols-2 gap-5 bg-zinc-900/60 backdrop-blur-md border border-zinc-850 p-6 rounded-2xl shadow-lg">
                        <div className="text-center border-r border-zinc-850 space-y-1">
                            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Hadir Masuk</span>
                            <p className="text-5xl font-black text-emerald-400 font-mono tracking-tight shadow-sm">{presenceCount}</p>
                        </div>
                        <div className="text-center space-y-1">
                            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Anggota Kelas</span>
                            <p className="text-5xl font-black text-white font-mono tracking-tight">{totalStudents}</p>
                        </div>
                    </div>

                    {/* Timer Countdown UI */}
                    <div className="flex items-center justify-center lg:justify-start gap-3 bg-zinc-900/20 border border-zinc-850/40 py-2.5 px-4 rounded-xl inline-flex w-auto mx-auto lg:mx-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-zinc-400 text-xs font-mono">
                            Sinkronisasi QR Ulang: <strong className="text-white font-bold">{countdown}s</strong>
                        </span>
                    </div>
                </div>
            </main>

            {/* Footer Navigation Back */}
            <footer className="relative z-10 border-t border-zinc-850 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-550 gap-4">
                <span className="font-mono">UTN Indonesia • Enkripsi Sinkron Waktu Kehadiran</span>
                <Link
                    href="/dashboard/attendance"
                    className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-800 hover:text-white transition-all duration-300 font-semibold"
                >
                    Kembali Ke Menu Dasbor
                </Link>
            </footer>
        </div>
    );
}

export default function LecturerSessionProjector() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500 text-xs font-mono">
                Menyiapkan visualisasi...
            </div>
        }>
            <LecturerSessionProjectorContent />
        </Suspense>
    );
}
