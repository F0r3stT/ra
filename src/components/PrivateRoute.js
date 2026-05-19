import React from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader text="Проверка авторизации..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="error" style={{ maxWidth: '500px', textAlign: 'center', background: '#2d1a1a', borderLeft: '4px solid #f85149', padding: '30px', borderRadius: '8px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}></span>
          <h3 style={{ color: '#f85149', marginBottom: '15px' }}>Доступ запрещён</h3>
          <p style={{ color: '#e4e6eb', marginBottom: '20px' }}>Для доступа к этой странице необходимо авторизоваться</p>
          <a href="/login" className="btn save" style={{ display: 'inline-block', textDecoration: 'none' }}>Перейти на страницу входа</a>
        </div>
      </div>
    );
  }

  return children;
}

export default PrivateRoute;