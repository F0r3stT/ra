import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function VulnerabilitiesList() {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVulnerabilities();
  }, []);

  const fetchVulnerabilities = async () => {
    try {
      const res = await axios.get('/api/vulnerabilities');
      setVulnerabilities(res.data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки уязвимостей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить уязвимость?')) {
      try {
        await axios.delete(`/api/vulnerabilities/${id}`);
        fetchVulnerabilities();
      } catch (err) {
        setError('Не удалось удалить уязвимость');
      }
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'Open': return 'Открыта';
      case 'Fixed': return 'Исправлена';
      case 'InProgress': return 'В работе';
      case 'Reopened': return 'Переоткрыта';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '#f85149';
      case 'Fixed': return '#3fb950';
      case 'InProgress': return '#d29922';
      case 'Reopened': return '#db6d28';
      default: return '#888';
    }
  };

  if (loading) return <div className="loader">Загрузка...</div>;

  return (
    <div className="page">
      <h2>Уязвимости</h2>
      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      <Link to="/vulnerabilities/create" className="btn save" style={{ marginBottom: '20px' }}>+ Добавить уязвимость</Link>
      
      <div className="cards">
        {vulnerabilities.map(v => (
          <div className="card" key={v.id}>
            <div className="head">
              <span className="status" style={{ background: getStatusColor(v.patch_status), color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                {getStatusText(v.patch_status)}
              </span>
              <span>Уровень: {v.threat_level || '—'}/5</span>
            </div>
            <h3>{v.vulnerability_type}</h3>
            <div className="meta">
              {v.software_version && <p><strong>Версия:</strong> {v.software_version}</p>}
              {v.system_name && <p><strong>Система:</strong> {v.system_name}</p>}
            </div>
            <p><strong>Обнаружена:</strong> {new Date(v.discovered_at).toLocaleDateString()}</p>
            {v.fixed_at && <p><strong>Исправлена:</strong> {new Date(v.fixed_at).toLocaleDateString()}</p>}
            <div className="actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <Link to={`/vulnerabilities/edit/${v.id}`} className="btn edit">Редактировать</Link>
              <button onClick={() => handleDelete(v.id)} className="btn delete">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VulnerabilitiesList;