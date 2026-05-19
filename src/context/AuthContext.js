import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../services/auth';

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth должен использоваться внутри AuthProvider');
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    const login = useCallback(async (username, password) => {
        try {
            const response = await authApi.login(username, password);
            localStorage.setItem('token', response.token);
            setToken(response.token);
            setUser(response.user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    const register = useCallback(async (username, email, password, verified) => {
        try {
            const response = await authApi.register(username, email, password, verified);
            localStorage.setItem('token', response.token);
            setToken(response.token);
            setUser(response.user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    const verifyToken = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return false;
        }
        try {
            const response = await authApi.verify(token);
            setUser(response.user);
            return true;
        } catch (error) {
            console.error('Ошибка:', error.message);
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            return false;
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        verifyToken();
    }, [verifyToken]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            loading, 
            login, 
            register, 
            logout, 
            isAuthenticated: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    );
}