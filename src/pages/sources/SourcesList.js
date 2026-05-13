import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function SourcesList() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await axios.get('/api/sources');
      setSources(res.data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки источников');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить источник?')) {
      try {
        await axios.delete(`/api/sources/${id}`);
        fetchSources();
      } catch (err) {
        setError('Не удалось удалить источник');
      }
    }
  };

  const getTypeText = (type) => {
    switch(type) {
      case 'System': return 'Система';
      case 'Device': return 'Устройство';
      case 'Person': return 'Человек';
      default: return type;
    }
  };

  if (loading) return <div className="loader">Загрузка...</div>;

  return (
    <div className="page">
      <h2>Источники инцидентов</h2>
      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      <Link to="/sources/create" className="btn save" style={{ marginBottom: '20px' }}>+ Добавить источник</Link>
      
      <div className="cards">
        {sources.map(s => (
          <div className="card" key={s.id}>
            <div className="head">
              <span className="type" style={{ background: '#6f42c1', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                {getTypeText(s.source_type)}
              </span>
            </div>
            <h3>{s.source_name}</h3>
            <div className="meta">
              {s.ip_address && <p><strong>IP адрес:</strong> {s.ip_address}</p>}
              {s.device_name && <p><strong>Устройство:</strong> {s.device_name}</p>}
              {s.contact_info && <p><strong>Контакт:</strong> {s.contact_info}</p>}
            </div>
            <div className="actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <Link to={`/sources/edit/${s.id}`} className="btn edit">Редактировать</Link>
              <button onClick={() => handleDelete(s.id)} className="btn delete">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SourcesList;