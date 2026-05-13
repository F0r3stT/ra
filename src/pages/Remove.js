import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';

function Remove() {
    const { id } = useParams();
    const nav = useNavigate();
    const { current, loading, err, loadOne, deleteItem, clearErr } = useApp();
    const [deleting, setDeleting] = useState(false);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        loadOne(id);
    }, [id, loadOne]);

    useEffect(() => {
        if (err === 'Запись не найдена') {
            setNotFound(true);
        }
    }, [err]);

    async function handleDelete() {
        setDeleting(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('Сессия истекла, войдите снова');
            nav('/login');
            return;
        }
        
        const result = await deleteItem(id);
        setDeleting(false);
        
        if (result) {
            clearErr();
            nav('/list');
        }
    }

    if (loading && !current) {
        return <Loader text="Загрузка данных..." />;
    }

    if (notFound || (err && !current)) {
        return (
            <div className="page">
                <div className="error" style={{ marginBottom: '20px' }}>
                    <span>{notFound ? 'Запись не найдена' : err}</span>
                    <button onClick={() => { clearErr(); nav('/list'); }} className="close">×</button>
                </div>
            </div>
        );
    }

    if (!current) {
        return null;
    }

    return (
        <div className="page remove">
            <div className="back">
                <Link to="/list">← Назад</Link>
            </div>

            <div className="remove-card">
                <div className="warning">
                    <span className="icon">⚠</span>
                    <h2>Удаление</h2>
                </div>

                <p className="message">
                    Удалить эту запись?<br />
                    <strong>Отменить нельзя</strong>
                </p>

                {err && (
                    <div className="error" style={{ marginBottom: '20px' }}>
                        <span>{err}</span>
                        <button onClick={clearErr} className="close">×</button>
                    </div>
                )}

                <div className="preview">
                    <div className="head">
                        <h3>{current.name}</h3>
                        <span className={'type ' + current.type}>
                            {current.type}
                        </span>
                    </div>
                    <div className="info">
                        <p><strong>Протокол:</strong> {current.protocol}</p>
                        <p><strong>Статус:</strong> {current.status}</p>
                        <p><strong>Дата:</strong> {current.date ? current.date.slice(0,10) : ''}</p>
                    </div>
                </div>

                <div className="remove-actions">
                    <button 
                        onClick={handleDelete} 
                        className="btn danger"
                        disabled={deleting}
                    >
                        {deleting ? 'Удаление...' : 'Да, удалить'}
                    </button>
                    <Link to={'/item/' + id} className="btn cancel">
                        Отмена
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Remove;