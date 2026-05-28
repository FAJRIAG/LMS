'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useSWR from 'swr';
import axios, { downloadSecureFile, previewSecurePDF } from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AssignmentDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const { data: assignment, mutate } = useSWR(`/api/assignments/${id}`, () =>
        axios.get(`/api/assignments/${id}`).then(res => res.data)
    );

    // Student upload states
    const [file, setFile] = useState(null);
    const [studentNotes, setStudentNotes] = useState('');
    const [uploadErrors, setUploadErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Lecturer grading states
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [gradeErrors, setGradeErrors] = useState([]);
    const [isGrading, setIsGrading] = useState(false);

    if (!assignment) {
        return (
            <div className="flex min-h-[400px] items-center justify-center bg-zinc-950 text-zinc-400">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400 mx-auto"></div>
                    <p className="text-xs font-mono">Memuat rincian evaluasi...</p>
                </div>
            </div>
        );
    }

    const deadlineDate = new Date(assignment.deadline_at);
    const isOverdue = new Date() > deadlineDate;

    // Student specific submission status
    const studentSubmission = user?.role === 'mahasiswa' ? assignment.submissions?.[0] : null;

    // Submit handler (Student)
    const handleSubmitSubmission = async (e) => {
        e.preventDefault();
        if (!file) {
            setUploadErrors(['Silakan pilih file pengumpulan tugas (.pdf, .docx, .zip)']);
            return;
        }

        setIsSubmitting(true);
        setUploadErrors([]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('student_notes', studentNotes);

        try {
            await axios.post(`/api/assignments/${id}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFile(null);
            setStudentNotes('');
            mutate(); // Revalidate assignment detail
        } catch (error) {
            if (error.response?.status === 422) {
                setUploadErrors([error.response.data.message || 'File ditolak. Periksa ekstensi file Anda.']);
            } else {
                setUploadErrors(['Terjadi kesalahan saat mengumpulkan tugas.']);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Grade submission handler (Lecturer)
    const handleGradeSubmission = async (e) => {
        e.preventDefault();
        if (!grade || isNaN(grade) || grade < 0 || grade > 100) {
            setGradeErrors(['Nilai angka harus berkisar antara 0 - 100']);
            return;
        }

        setIsGrading(true);
        setGradeErrors([]);

        try {
            await axios.post(`/api/submissions/${selectedSubmission.id}/grade`, {
                grade: parseInt(grade),
                lecturer_feedback: feedback,
            });

            setSelectedSubmission(null);
            setGrade('');
            setFeedback('');
            mutate(); // Revalidate assignments schema
        } catch (error) {
            setGradeErrors(['Gagal mengirimkan penilaian.']);
        } finally {
            setIsGrading(false);
        }
    };

    return (
        <div className="space-y-8 selection:bg-zinc-800 selection:text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Link href="/dashboard/assignments" className="hover:text-zinc-300 transition-colors">Tugas Kuliah</Link>
                <span className="text-zinc-700">&rsaquo;</span>
                <span className="text-zinc-300">Rincian Penugasan</span>
            </div>

            {/* Instruction Details */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-850 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-8 shadow-xl">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-zinc-800/5 blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                                Deskripsi Tugas Kelas
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                <span className="bg-gradient-to-r from-zinc-100 via-white to-zinc-400 bg-clip-text text-transparent">
                                    {assignment.title}
                                </span>
                            </h2>
                        </div>
                        
                        <div className="text-left sm:text-right space-y-1 font-mono text-[10px] text-zinc-500 self-start">
                            <p>Pembuat: <strong className="text-zinc-300">{assignment.user?.name}</strong></p>
                            <p>Tenggat: <strong className="text-zinc-300">{deadlineDate.toLocaleString('id-ID')} WIB</strong></p>
                        </div>
                    </div>

                    <div className="border-t border-zinc-850 pt-6 space-y-3">
                        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Instruksi & Silabus Pengerjaan:</h3>
                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">{assignment.instructions}</p>
                    </div>

                    {assignment.attachment_path && (
                        <div className="bg-zinc-950/80 border border-zinc-850/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-zinc-800 transition-colors duration-300">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                    Berkas Lampiran Pendukung
                                </p>
                                <p className="text-xs text-zinc-500 leading-normal">Gunakan dokumen terlampir ini sebagai dasar atau referensi pemecahan masalah.</p>
                            </div>
                            <button
                                onClick={() => downloadSecureFile(`/api/assignments/${assignment.id}/download`, assignment.attachment_path.split('/').pop())}
                                className="px-4 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-750 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                            >
                                Unduh Lampiran
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* STUDENT PORTAL VIEW */}
            {user?.role === 'mahasiswa' && (
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-850 p-8 rounded-3xl space-y-6 shadow-xl shadow-zinc-950/40 relative overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-zinc-850 pb-4">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Unggah Lembar Jawaban Mahasiswa</h3>
                    </div>

                    {/* Already submitted state details */}
                    {studentSubmission ? (
                        <div className="space-y-6">
                            <div className="bg-emerald-950/20 border border-emerald-900/45 text-emerald-400 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">Dokumen Terkirim Berhasil</p>
                                    <p className="text-xs text-zinc-400">
                                        Tanggal log pengiriman: {new Date(studentSubmission.submitted_at).toLocaleString('id-ID')} WIB
                                    </p>
                                </div>
                                <div className="bg-emerald-950/60 border border-emerald-800 px-4 py-2 rounded-xl text-center self-start sm:self-center">
                                    <p className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Status Nilai</p>
                                    <p className="text-xl font-black text-white font-mono mt-0.5">
                                        {studentSubmission.grade !== null ? `${studentSubmission.grade}/100` : 'Belum Dinilai'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5 text-sm">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Berkas Yang Diunggah:</h4>
                                    <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-center justify-between text-xs gap-4">
                                        <span className="font-mono text-zinc-300 truncate">{studentSubmission.file_path?.split('/').pop()}</span>
                                        <div className="flex items-center gap-2">
                                            {studentSubmission.file_path?.endsWith('.pdf') && (
                                                <button
                                                    type="button"
                                                    onClick={() => previewSecurePDF(`/api/submissions/${studentSubmission.id}/download`)}
                                                    className="px-3 py-1.5 bg-indigo-900/50 hover:bg-indigo-800/80 text-indigo-300 border border-indigo-700/50 rounded font-semibold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                                                >
                                                    Lihat PDF
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => downloadSecureFile(`/api/submissions/${studentSubmission.id}/download`, studentSubmission.file_path.split('/').pop())}
                                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-semibold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                                            >
                                                Unduh
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Catatan Mahasiswa:</h4>
                                    <p className="text-zinc-350 bg-zinc-950 p-4 rounded-xl border border-zinc-850/80 text-xs leading-relaxed whitespace-pre-wrap">
                                        {studentSubmission.student_notes || 'Tidak ada catatan yang disertakan.'}
                                    </p>
                                </div>

                                {studentSubmission.lecturer_feedback && (
                                    <div className="p-5 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
                                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                                            Masukan & Umpan Balik Dosen:
                                        </h4>
                                        <p className="text-zinc-300 text-xs italic leading-relaxed">"{studentSubmission.lecturer_feedback}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : isOverdue ? (
                        <div className="bg-red-950/20 border border-red-900/45 text-red-400 p-5 rounded-2xl space-y-1">
                            <p className="font-bold text-sm">Batas Waktu Telah Habis</p>
                            <p className="text-xs text-zinc-450 leading-relaxed">Tenggat batas pengumpulan tugas untuk sesi kelas ini telah ditutup. Anda tidak dapat melakukan pengumpulan berkas baru.</p>
                        </div>
                    ) : (
                        // Form pengumpulan tugas
                        <form onSubmit={handleSubmitSubmission} className="space-y-5">
                            {uploadErrors.length > 0 && (
                                <div className="bg-red-950/20 border border-red-900/45 text-red-400 px-4 py-3 rounded-xl text-xs space-y-1">
                                    {uploadErrors.map((err, i) => (
                                        <p key={i} className="flex items-center gap-1.5">
                                            <span className="h-1 w-1 bg-red-400 rounded-full inline-block" />
                                            {err}
                                        </p>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450">Berkas Jawaban (.pdf, .docx, .zip)</label>
                                <div className="border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 p-8 text-center transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-950/80 relative overflow-hidden group">
                                    <input
                                        type="file"
                                        required
                                        onChange={(e) => setFile(e.target.files[0])}
                                        accept=".pdf,.docx,.zip"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="space-y-2 pointer-events-none">
                                        <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 group-hover:text-zinc-200 group-hover:border-zinc-700 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                                        </div>
                                        <p className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
                                            {file ? file.name : 'Pilih Berkas Tugas (.pdf, .docx, .zip)'}
                                        </p>
                                        <p className="text-[10px] text-zinc-550 font-mono">
                                            {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Batas maksimal ukuran berkas: 10 MB.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450">Catatan Pendukung Tambahan</label>
                                <textarea
                                    value={studentNotes}
                                    onChange={(e) => setStudentNotes(e.target.value)}
                                    placeholder="Tuliskan catatan tambahan seperti pranala repositori Git atau ringkasan solusi pengerjaan program..."
                                    className="w-full h-28 px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-850 text-white placeholder-zinc-700 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-600 transition-all duration-300 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-gradient-to-b from-zinc-100 to-zinc-200 hover:from-white hover:to-zinc-100 border-t border-white/10 text-zinc-950 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-white/5 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                            >
                                {isSubmitting ? 'Mengirim Lembar Jawaban...' : 'Kumpulkan Evaluasi'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* LECTURER PORTAL VIEW (GRADING ENGINE) */}
            {user?.role === 'dosen' && (
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-850 rounded-3xl overflow-hidden shadow-xl shadow-zinc-950/40">
                    <div className="p-6 border-b border-zinc-850/60">
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Panel Penilaian Berkas Jawaban Mahasiswa</h3>
                    </div>

                    {/* Submissions Grading Table */}
                    {assignment.submissions && assignment.submissions.length === 0 ? (
                        <div className="p-12 text-center text-zinc-550 text-sm">
                            Belum ada mahasiswa yang mengumpulkan lembar jawaban tugas pada pertemuan ini.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-300">
                                <thead className="bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-450 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4">Mahasiswa</th>
                                        <th className="px-6 py-4">NIM</th>
                                        <th className="px-6 py-4">Tanggal Kumpul</th>
                                        <th className="px-6 py-4">Status Nilai</th>
                                        <th className="px-6 py-4 text-right">Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-850/60">
                                    {assignment.submissions?.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-zinc-900/20 transition-all duration-200">
                                            <td className="px-6 py-4 font-semibold text-white">{sub.user?.name}</td>
                                            <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{sub.user?.nim_nip}</td>
                                            <td className="px-6 py-4 text-zinc-400 text-xs">
                                                {new Date(sub.submitted_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {sub.grade !== null ? (
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-green-950/30 text-green-400 border border-green-900/40">
                                                        Nilai: {sub.grade}/100
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-950/30 text-amber-400 border border-amber-900/40 animate-pulse">
                                                        Belum Dinilai
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubmission(sub);
                                                        setGrade(sub.grade !== null ? sub.grade.toString() : '');
                                                        setFeedback(sub.lecturer_feedback || '');
                                                    }}
                                                    className="px-3.5 py-2 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-750 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                                >
                                                    Periksa & Nilai
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Lecturer Grading Modal / Drawer UI */}
            {user?.role === 'dosen' && selectedSubmission && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-8 space-y-6 text-zinc-200 relative">
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-zinc-800/5 blur-[50px] pointer-events-none" />
                        
                        <div className="relative z-10 flex items-center justify-between border-b border-zinc-850 pb-4">
                            <div className="space-y-1">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider bg-zinc-800 text-zinc-350">
                                    Lembar Kerja Ujian
                                </span>
                                <h4 className="text-lg font-black text-white">{selectedSubmission.user?.name}</h4>
                            </div>
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Tutup Panel
                            </button>
                        </div>

                        {gradeErrors.length > 0 && (
                            <div className="bg-red-950/20 border border-red-900/45 text-red-400 px-4 py-3 rounded-xl text-xs space-y-1">
                                {gradeErrors.map((err, i) => <p key={i}>{err}</p>)}
                            </div>
                        )}

                        <div className="relative z-10 space-y-5 text-sm">
                            <div className="space-y-1.5">
                                <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Catatan Jawaban Mahasiswa:</h5>
                                <p className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850 text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {selectedSubmission.student_notes || 'Tidak ada catatan tambahan.'}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl hover:border-zinc-800 transition-colors">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] text-zinc-450 font-bold uppercase block">Dokumen Lembar Kerja</span>
                                    <span className="text-[10px] text-zinc-550 font-mono block truncate max-w-[200px]">
                                        {selectedSubmission.file_path?.split('/').pop()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedSubmission.file_path?.endsWith('.pdf') && (
                                        <button
                                            type="button"
                                            onClick={() => previewSecurePDF(`/api/submissions/${selectedSubmission.id}/download`)}
                                            className="px-4 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-indigo-900/50 hover:bg-indigo-800/80 text-indigo-300 hover:text-white border border-indigo-700/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                                        >
                                            Lihat PDF
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => downloadSecureFile(`/api/submissions/${selectedSubmission.id}/download`, selectedSubmission.file_path.split('/').pop())}
                                        className="px-4 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-750 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                                    >
                                        Unduh
                                    </button>
                                </div>
                            </div>

                            {/* Grading Input Form */}
                            <form onSubmit={handleGradeSubmission} className="space-y-4 border-t border-zinc-850 pt-5">
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <label className="col-span-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-450">Input Nilai Tugas (Skala 0 - 100):</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        placeholder="0-100"
                                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-850 text-white placeholder-zinc-750 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 text-center font-bold font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450">Koreksi & Umpan Balik Guru</label>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Tuliskan umpan balik koreksi, saran revisi, atau evaluasi pengerjaan solusi..."
                                        className="w-full h-24 px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-850 text-white placeholder-zinc-700 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-650 transition-all duration-300 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isGrading}
                                    className="w-full py-3.5 bg-gradient-to-b from-zinc-100 to-zinc-200 hover:from-white hover:to-zinc-100 border-t border-white/10 text-zinc-950 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-white/5 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                                >
                                    {isGrading ? 'Menyimpan Nilai...' : 'Publikasikan Hasil Penilaian'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
