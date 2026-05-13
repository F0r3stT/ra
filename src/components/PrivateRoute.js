import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader text="Проверка авторизации..." />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default PrivateRoute;