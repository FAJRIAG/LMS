import axios from 'axios';

const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        // Dinamis mendeteksi hostname saat ini (localhost atau 127.0.0.1)
        // agar browser tidak memblokir cookie sesi lintas-domain (SameSite Lax)
        return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
};

const axiosInstance = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
    withCredentials: true, // Wajib agar session cookie otomatis terkirim
});

export const getDownloadURL = (path) => {
    return `${getBaseURL()}${path}`;
};

export const downloadSecureFile = async (path, filename) => {
    try {
        const response = await axiosInstance.get(path, {
            responseType: 'blob',
        });
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Secure download failed:', error);
        alert('Gagal mengunduh berkas. Sesi Anda mungkin telah kedaluwarsa atau Anda tidak memiliki hak akses.');
    }
};

export const previewSecurePDF = async (path) => {
    try {
        const response = await axiosInstance.get(path, {
            responseType: 'blob',
        });
        const file = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL);
    } catch (error) {
        console.error('PDF preview failed:', error);
        alert('Gagal menampilkan pratinjau PDF. Sesi Anda mungkin telah kedaluwarsa atau Anda tidak memiliki hak akses.');
    }
};

export default axiosInstance;
