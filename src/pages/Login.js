import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

function Login({ showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      if (showToast) showToast(location.state.error, 'error');
    }
  }, [location, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(username, password);
    
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      if (showToast) showToast(result.error, 'error');
    }
  };

  if (loading) {
    return <Loader text="Вход..." />;
  }

  return (
    <div className="page" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div className="form" style={{ marginTop: '50px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#8ab4f8' }}>
          Вход в систему
        </h2>
        
        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} className="close">×</button>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Имя пользователя или Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn save" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          Нет аккаунта? <Link to="/register" style={{ color: '#8ab4f8' }}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;