import useSWR from 'swr';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
    const router = useRouter();

    const { data: user, error, mutate } = useSWR('/api/user', () =>
        axios
            .get('/api/user')
            .then(res => res.data)
            .catch(error => {
                if (error.response?.status !== 401) {
                    throw error;
                }
            })
    );

    const csrf = () => axios.get('/sanctum/csrf-cookie');

    const login = async ({ email, password, setErrors, setStatus }) => {
        setErrors([]);
        setStatus(null);

        try {
            // Wajib dapatkan CSRF Cookie terlebih dahulu
            await csrf();

            const response = await axios.post('/api/login', { email, password });
            mutate(response.data);

            setStatus('logged_in');
        } catch (error) {
            console.warn('Login error full response:', error);
            if (error.response?.status === 422) {
                setErrors(Object.values(error.response.data.errors).flat());
            } else if (error.response?.status === 419) {
                setErrors(['Sesi kedaluwarsa / Token CSRF tidak valid (Eror 419). Silakan refresh halaman browser.']);
            } else if (error.response?.data?.message) {
                setErrors([error.response.data.message]);
            } else {
                setErrors(['Terjadi kesalahan koneksi ke server atau CORS diblokir.']);
            }
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout');
            mutate(null);
            router.push('/');
        } catch (error) {
            console.warn('Logout error:', error);
        }
    };

    // Client-side route guarding logic
    useEffect(() => {
        if (middleware === 'guest' && user && redirectIfAuthenticated) {
            router.push(redirectIfAuthenticated);
        }

        if (middleware === 'auth' && error) {
            router.push('/');
        }
    }, [user, error, middleware, router, redirectIfAuthenticated]);

    return {
        user,
        login,
        logout,
        isLoading: !user && !error,
    };
};
