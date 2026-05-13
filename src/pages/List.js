import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPaginated } from '../services/requests';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

function List({ showToast }) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Администратор';
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [typeFilter, setTypeFilter] = useState('Все');
    const [statusFilter, setStatusFilter] = useState('Все');
    const limit = 10;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getPaginated(page, limit, typeFilter, statusFilter);
            setItems(result.data);
            setTotalPages(result.totalPages);
        } catch (err) {
            if (showToast) showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [page, limit, typeFilter, statusFilter, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) return <Loader text="Загрузка списка..." />;

    return (
        <div className="page">
            <h2>Все атаки</h2>
            
            <div className="filters" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={{ padding: '8px', background: '#1a1e24', border: '1px solid #2a2f38', color: '#fff', borderRadius: '6px' }}>
                    <option value="Все">Все типы</option>
                    <option value="Внешняя">Внешняя</option>
                    <option value="Внутренняя">Внутренняя</option>
                </select>
                
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px', background: '#1a1e24', border: '1px solid #2a2f38', color: '#fff', borderRadius: '6px' }}>
                    <option value="Все">Все статусы</option>
                    <option value="Активна">Активна</option>
                    <option value="Заблокирована">Заблокирована</option>
                    <option value="Закрыта">Закрыта</option>
                </select>
            </div>

            {items.length === 0 ? (
                <div className="empty">
                    <p>Атаки не зафиксированы</p>
                    {isAdmin && <Link to="/create" className="btn">Добавить первую</Link>}
                </div>
            ) : (
                <>
                    <div className="cards">
                        {items.map(x => (
                            <Link to={'/item/' + x.id} className="card" key={x.id}>
                                <div className="head">
                                    <span className={'type ' + x.type}>{x.type}</span>
                                    <span className="date">{x.date ? new Date(x.date).toLocaleDateString('ru-RU') : ''}</span>
                                </div>
                                <h3>{x.name}</h3>
                                <div className="meta">
                                    <span className="proto">{x.protocol}</span>
                                    <span className={'status ' + x.status}>{x.status}</span>
                                </div>
                                <p className="desc">{(x.description || '').substring(0, 80)}...</p>
                                <div className="more">Подробнее →</div>
                            </Link>
                        ))}
                    </div>
                    
                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn">Назад</button>
                        <span style={{ padding: '8px 16px', background: '#0b0f14', borderRadius: '6px' }}>Страница {page} из {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="btn">Вперед</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default List;