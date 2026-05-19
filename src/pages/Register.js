import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendCode, verifyCode } from '../services/auth';
import Loader from '../components/Loader';

function Register({ showToast }) {
    const [step, setStep] = useState('form');
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verified, setVerified] = useState(false);
    const { register, login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        
        if (form.password !== form.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        
        if (form.password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            await sendCode(form.email);
            setStep('code');
            if (showToast) showToast('Код отправлен на почту', 'success');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await verifyCode(form.email, code);
            setVerified(true);
            setStep('register');
            if (showToast) showToast('Email подтверждён', 'success');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await register(form.username, form.email, form.password, verified);
            await login(form.username, form.password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader text="Загрузка..." />;
    }

    if (step === 'form') {
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
                    
                    <form onSubmit={handleSendCode}>
                        <div className="field">
                            <label>Имя пользователя</label>
                            <input type="text" name="username" value={form.username} onChange={handleChange} required autoFocus />
                        </div>
                        
                        <div className="field">
                            <label>Email (на него придёт код)</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required />
                        </div>
                        
                        <div className="field">
                            <label>Пароль (минимум 6 символов)</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} required />
                        </div>
                        
                        <div className="field">
                            <label>Подтверждение пароля</label>
                            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
                        </div>
                        
                        <div className="form-actions">
                            <button type="submit" className="btn save">Получить код</button>
                        </div>
                    </form>
                    
                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
                        Уже есть аккаунт? <Link to="/login" style={{ color: '#8ab4f8' }}>Войти</Link>
                    </p>
                </div>
            </div>
        );
    }

    if (step === 'code') {
        return (
            <div className="page" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <div className="form" style={{ marginTop: '50px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#8ab4f8' }}>
                        Подтверждение email
                    </h2>
                    
                    <p style={{ textAlign: 'center', marginBottom: '20px', color: '#888' }}>
                        Код отправлен на {form.email}
                    </p>
                    
                    {error && (
                        <div className="error" style={{ marginBottom: '20px' }}>
                            <span>{error}</span>
                            <button onClick={() => setError('')} className="close">×</button>
                        </div>
                    )}
                    
                    <form onSubmit={handleVerifyCode}>
                        <div className="field">
                            <label>Введите код из письма</label>
                            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength="6" required autoFocus />
                        </div>
                        
                        <div className="form-actions">
                            <button type="submit" className="btn save">Подтвердить</button>
                        </div>
                    </form>
                    
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button onClick={() => { setStep('form'); setError(''); }} style={{ background: 'none', border: 'none', color: '#8ab4f8', cursor: 'pointer' }}>
                            ← Назад
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    if (step === 'register') {
        return (
            <div className="page" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <div className="form" style={{ marginTop: '50px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#8ab4f8' }}>
                        Завершение регистрации
                    </h2>
                    
                    <p style={{ textAlign: 'center', marginBottom: '20px', color: '#3fb950' }}>
                        Email подтверждён!
                    </p>
                    
                    {error && (
                        <div className="error" style={{ marginBottom: '20px' }}>
                            <span>{error}</span>
                            <button onClick={() => setError('')} className="close">×</button>
                        </div>
                    )}
                    
                    <form onSubmit={handleRegister}>
                        <div className="form-actions">
                            <button type="submit" className="btn save">Завершить регистрацию</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return null;
}

export default Register;