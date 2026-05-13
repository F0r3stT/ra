import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    if (form.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }
    
    setLoading(true);
    const result = await register(form.username, form.email, form.password);
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  if (loading) {
    return <Loader text="Регистрация..." />;
  }

  return (
    <div className="page" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div className="form" style={{ marginTop: '50px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#8ab4f8' }}>
          Регистрация
        </h2>
        
        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} className="close">×</button>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Имя пользователя</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="field">
            <label>Пароль (минимум 6 символов)</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="field">
            <label>Подтверждение пароля</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn save" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          Уже есть аккаунт? <Link to="/login" style={{ color: '#8ab4f8' }}>Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;