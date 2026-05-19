import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

function AdminRoute({ children }) {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Loader text="Проверка прав доступа..." />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ error: 'Для доступа к этой странице необходимо войти в систему' }} />;
    }

    const isAdmin = user?.role === 'Администратор' || user?.role === 'admin' || user?.role === 'Admin';
    if (!isAdmin) {
        return <Navigate to="/" state={{ error: 'У вас нет прав доступа к этой странице' }} />;
    }

    return children;
}

export default AdminRoute;