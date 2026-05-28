'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Link from 'next/link';

export default function StudentAttendanceScanner() {
    const router = useRouter();
    const [scanResult, setScanResult] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    const [statusCode, setStatusCode] = useState(''); // 'success', 'error', 'processing'
    
    useEffect(() => {
        // Initialize HTML5 QR Code Scanner
        const scanner = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
        });

        const onScanSuccess = async (decodedText) => {
            scanner.clear(); // Stop camera scan
            setScanResult(decodedText);
            setStatusCode('processing');
            setStatusMsg('Membaca sandi... Sedang memverifikasi token presensi...');

            try {
                const response = await axios.post('/api/attendance/scan', {
                    payload: decodedText,
                });

                setStatusCode('success');
                setStatusMsg('Presensi berhasil tercatat! Sedang dialihkan...');
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    router.push('/dashboard/attendance');
                }, 2000);
            } catch (error) {
                setStatusCode('error');
                const errMsg = error.response?.data?.message || 'Token absensi tidak valid atau telah kedaluwarsa.';
                setStatusMsg(errMsg);
            }
        };

        const onScanFailure = (error) => {
            // Quietly ignore scanner loop failures (normal behavior)
        };

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            scanner.clear().catch(err => console.warn('Failed to clear scanner on unmount', err));
        };
    }, [router]);

    return (
        <div className="space-y-8 max-w-md mx-auto selection:bg-zinc-800 selection:text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Link href="/dashboard/attendance" className="hover:text-zinc-300 transition-colors">Presensi</Link>
                <span className="text-zinc-700">&rsaquo;</span>
                <span className="text-zinc-300">Kamera Pemindai QR</span>
            </div>

            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-6 text-center shadow-xl shadow-zinc-950/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-zinc-800/5 blur-[45px] pointer-events-none" />
                
                <div className="relative z-10 space-y-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-widest bg-zinc-800 text-zinc-350 border border-zinc-750">
                        Kamera HP Mahasiswa
                    </span>
                    <h2 className="text-xl font-black text-white tracking-tight">Pindai QR Kehadiran</h2>
                    <p className="text-xs text-zinc-450 leading-relaxed max-w-xs mx-auto">Posisikan kode QR absensi dinamis dari layar proyektor kelas tepat di tengah jendela bidik kamera.</p>
                </div>

                {/* Verification response indicator */}
                {statusMsg && (
                    <div className={`relative z-10 p-5 rounded-2xl text-xs border font-semibold transition-all duration-300 ${
                        statusCode === 'success' ? 'bg-green-950/20 border-green-900/45 text-green-400' :
                        statusCode === 'error' ? 'bg-red-950/20 border-red-900/45 text-red-400' :
                        'bg-zinc-950/80 border-zinc-850 text-zinc-400 animate-pulse'
                    }`}>
                        <div className="flex items-center justify-center gap-2">
                            {statusCode === 'processing' && <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-ping inline-block" />}
                            {statusCode === 'success' && <span className="h-1.5 w-1.5 bg-green-400 rounded-full inline-block shadow-[0_0_8px_#10b981]" />}
                            {statusCode === 'error' && <span className="h-1.5 w-1.5 bg-red-400 rounded-full inline-block" />}
                            <p>{statusMsg}</p>
                        </div>
                        {statusCode === 'error' && (
                            <button
                                onClick={() => window.location.reload()}
                                className="block mt-3 mx-auto px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-800 text-[9px] uppercase tracking-widest font-extrabold text-red-400 rounded-lg transition-colors cursor-pointer"
                            >
                                Ulangi Pindai Kamera
                            </button>
                        )}
                    </div>
                )}

                {/* HTML5 QR Code scanner mounting container */}
                <div className="relative z-10 bg-zinc-950 border border-zinc-850 p-4 rounded-2xl overflow-hidden shadow-inner">
                    <div id="reader" className="w-full rounded-xl overflow-hidden text-zinc-400 border-0" />
                </div>

                <div className="relative z-10 text-center">
                    <Link
                        href="/dashboard/attendance"
                        className="inline-block px-5 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-750 transition-colors"
                    >
                        Batalkan Sesi Pindai
                    </Link>
                </div>
            </div>
        </div>
    );
}
