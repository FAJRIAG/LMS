'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useSWR from 'swr';
import axios, { downloadSecureFile, previewSecurePDF } from '@/lib/axios';
import { useClassroom } from '@/context/ClassroomContext';

const FILE_META = {
    pdf:  { color: 'text-red-400',   bg: 'bg-red-950/30',   border: 'border-red-900/40',  icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    docx: { color: 'text-blue-400',  bg: 'bg-blue-950/30',  border: 'border-blue-900/40', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    pptx: { color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-900/40', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
};

export default function Materials() {
    const { user } = useAuth();
    const { activeClassId } = useClassroom();
    
    const { data: materials, mutate } = useSWR(
        activeClassId ? `/api/materials?classroom_id=${activeClassId}` : null,
        () => axios.get(`/api/materials?classroom_id=${activeClassId}`).then(res => res.data)
    );

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) { setErrors(['Harap pilih file terlebih dahulu.']); return; }
        setIsUploading(true);
        setErrors([]);

        const formData = new FormData();
        formData.append('classroom_id', activeClassId);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('file', file);

        try {
            await axios.post('/api/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setTitle(''); setDescription(''); setFile(null);
            document.getElementById('fileInput').value = '';
            mutate();
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(Object.values(error.response.data.errors).flat());
            } else {
                setErrors(['Gagal mengunggah materi perkuliahan.']);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
        try { await axios.delete(`/api/materials/${id}`); mutate(); }
        catch (error) { console.warn('Delete error:', error); }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) setFile(dropped);
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-zinc-800/50 pb-6 animate-fade-in">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-blue-950/40 border border-blue-900/40 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.08)]">
                            <svg className="w-4.5 h-4.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Materi Perkuliahan</h2>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed pl-11.5">
                        Distribusi modul perkuliahan dan unduh silabus pendukung kelas yang aktif.
                    </p>
                </div>
                {materials && (
                    <span className="self-start md:self-auto px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">
                        {materials.length} Modul
                    </span>
                )}
            </div>

            {/* Upload form (dosen only) */}
            {user?.role === 'dosen' && (
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-xl animate-fade-in delay-100">
                    <div className="flex items-center gap-3 p-6 border-b border-zinc-800/50">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Bagikan Modul Baru</h3>
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

                        <form onSubmit={handleUpload} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Judul Materi</label>
                                    <input
                                        type="text" required value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Contoh: Pertemuan 1 — Arsitektur Web SPA"
                                        className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 transition-all duration-300 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Deskripsi Singkat</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ringkasan modul atau catatan pendukung materi..."
                                        className="w-full h-28 px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 transition-all duration-300 resize-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Unggah Berkas (.pdf, .pptx, .docx)</label>
                                    <div
                                        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                                            isDragging ? 'border-zinc-500 bg-zinc-800/30' : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/30'
                                        }`}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            type="file" id="fileInput" required
                                            onChange={(e) => setFile(e.target.files[0])}
                                            accept=".pdf,.pptx,.docx"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="space-y-2 pointer-events-none">
                                            <div className="h-10 w-10 rounded-xl bg-zinc-800/60 border border-zinc-700/30 flex items-center justify-center mx-auto">
                                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                                </svg>
                                            </div>
                                            {file ? (
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-200">{file.name}</p>
                                                    <p className="text-[10px] text-zinc-500 font-mono">{(file.size / (1024*1024)).toFixed(2)} MB</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm font-semibold text-zinc-400">Seret berkas ke sini atau klik</p>
                                                    <p className="text-[10px] text-zinc-600 font-mono">PDF, PPTX, DOCX — Maks. 10 MB</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={isUploading}
                                    className="w-full py-4 bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-zinc-100 text-zinc-950 font-bold rounded-2xl text-sm tracking-wide transition-all duration-300 shadow-2xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <><div className="h-4 w-4 border-2 border-zinc-400/30 border-t-zinc-700 rounded-full animate-spin" />Mengunggah Berkas...</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>Publikasikan Modul</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Materials list */}
            <div className="space-y-4 animate-fade-in delay-200">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-800/50" />
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Daftar Modul Terdistribusi</p>
                    <div className="h-px flex-1 bg-zinc-800/50" />
                </div>

                {!materials ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-28 rounded-2xl shimmer" />
                        ))}
                    </div>
                ) : materials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-zinc-800/50 rounded-3xl">
                        <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-zinc-400">Belum Ada Materi</p>
                            <p className="text-xs text-zinc-600 mt-1">Dosen belum membagikan modul perkuliahan pada kelas ini.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {materials.map((material, idx) => {
                            const type = material.file_type?.toLowerCase();
                            const meta = FILE_META[type] || FILE_META.pdf;

                            return (
                                <div key={material.id} className={`group flex flex-col sm:flex-row sm:items-center gap-5 bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/60 rounded-2xl p-5 transition-all duration-300 animate-fade-in`} style={{ animationDelay: `${idx * 60}ms` }}>
                                    {/* File type icon */}
                                    <div className={`flex-shrink-0 h-14 w-14 rounded-2xl ${meta.bg} border ${meta.border} flex flex-col items-center justify-center gap-0.5 shadow-inner`}>
                                        <svg className={`w-5 h-5 ${meta.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={meta.icon} />
                                        </svg>
                                        <span className={`text-[8px] font-black uppercase tracking-wider ${meta.color}`}>{type}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-start gap-2 flex-wrap">
                                            <h4 className="font-black text-white text-sm leading-tight">{material.title}</h4>
                                        </div>
                                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                                            {material.description || 'Tidak ada deskripsi tambahan.'}
                                        </p>
                                        <p className="text-[10px] text-zinc-600 font-mono">
                                            <span className="text-zinc-500">{material.user?.name}</span>
                                            <span className="mx-1.5">•</span>
                                            {new Date(material.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                                        {type === 'pdf' && (
                                            <button
                                                onClick={() => previewSecurePDF(`/api/materials/${material.id}/download`)}
                                                className="px-3.5 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all duration-300 active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                Pratinjau
                                            </button>
                                        )}
                                        <button
                                            onClick={() => downloadSecureFile(`/api/materials/${material.id}/download`, `${material.title}.${type}`)}
                                            className="px-3.5 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-600 transition-all duration-300 active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                            Unduh
                                        </button>
                                        {user?.role === 'dosen' && (
                                            <button
                                                onClick={() => handleDelete(material.id)}
                                                className="p-2.5 text-[10px] uppercase font-bold rounded-xl bg-red-950/10 hover:bg-red-950/30 text-red-500/70 hover:text-red-400 border border-red-900/20 hover:border-red-900/40 transition-all duration-300 active:scale-[0.97] cursor-pointer"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            </button>
                                        )}
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
