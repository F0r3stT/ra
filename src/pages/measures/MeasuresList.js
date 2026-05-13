import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function MeasuresList() {
  const [measures, setMeasures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMeasures();
  }, []);

  const fetchMeasures = async () => {
    try {
      const res = await axios.get('/api/measures');
      setMeasures(res.data);
    } catch (err) {
      setError('Ошибка загрузки мер реагирования');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить меру реагирования?')) {
      try {
        await axios.delete(`/api/measures/${id}`);
        fetchMeasures();
      } catch (err) {
        setError('Не удалось удалить меру');
      }
    }
  };

  if (loading) return <div className="loader">Загрузка...</div>;

  return (
    <div className="page">
      <h2>Меры реагирования</h2>
      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      <Link to="/measures/create" className="btn save" style={{ marginBottom: '20px' }}>+ Добавить меру</Link>
      
      <div className="cards">
        {measures.map(m => (
          <div className="card" key={m.id}>
            <div className="head">
              <span className="type" style={{ background: '#6f42c1', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                {m.measure_type}
              </span>
              <span className="date">{new Date(m.executed_at).toLocaleDateString()}</span>
            </div>
            <h3>{m.measure_name}</h3>
            <p className="desc">{m.description || 'Нет описания'}</p>
            <div className="meta">
              {m.incident_name && <p><strong>Инцидент:</strong> {m.incident_name}</p>}
              {m.employee_name && <p><strong>Сотрудник:</strong> {m.employee_name}</p>}
            </div>
            <div className="actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <Link to={`/measures/edit/${m.id}`} className="btn edit">Редактировать</Link>
              <button onClick={() => handleDelete(m.id)} className="btn delete">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MeasuresList;