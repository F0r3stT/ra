import React from 'react';
import { Link } from 'react-router-dom'; // <--- Вот тот самый недостающий импорт!
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader text="Проверка авторизации..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="form" style={{ textAlign: 'center', padding: '50px 40px', maxWidth: '420px', width: '100%' }}>
          
          {/* Иконка замка */}
          <div style={{ marginBottom: '20px' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <h2 style={{ color: '#e6edf3', marginBottom: '15px', fontSize: '24px' }}>
            Доступ закрыт
          </h2>
          
          <p style={{ color: '#8b949e', marginBottom: '35px', lineHeight: '1.6', fontSize: '15px' }}>
            Для работы с системой мониторинга сетевых атак необходимо войти в свою учетную запись.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Link 
              to="/login" 
              className="btn save" 
              style={{ 
                display: 'block', 
                textDecoration: 'none', 
                textAlign: 'center',
                padding: '12px',
                fontSize: '16px'
              }}
            >
              Войти в систему
            </Link>
            
            <Link 
              to="/register" 
              style={{ 
                color: '#8ab4f8', 
                textDecoration: 'none', 
                fontSize: '14px',
                marginTop: '10px',
                display: 'inline-block'
              }}
            > 
              У меня еще нет аккаунта
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return children;
}

export default PrivateRoute;  