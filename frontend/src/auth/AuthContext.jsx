import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, userService } from '../services/api';
import Loader from '../components/ui/Loader';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const res = await userService.getProfile();
            if (res.data?.success && res.data.user) {
                setUser(res.data.user);
                return res.data.user;
            }
            setUser(null);
            return null;
        } catch {
            setUser(null);
            return null;
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            await fetchUser();
            if (mounted) setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [fetchUser]);

    const login = async (credentials) => {
        const response = await authService.login(credentials);
        if (response.data?.user) {
            setUser(response.data.user);
            return response.data.user;
        }
        throw new Error(response.data?.message || 'Login failed');
    };

    const register = async (data) => {
        const response = await authService.register(data);
        return response.data;
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
        }
    };

    const refreshUser = async () => fetchUser();

    if (loading) {
        return <Loader fullScreen label="Loading EventHub..." />;
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    return useContext(AuthContext);
}
