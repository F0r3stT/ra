import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/audit-log')
      .then(res => {
        setLogs(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Ошибка загрузки журнала аудита');
        setLoading(false);
      });
  }, []);

  const getActionText = (action) => {
    switch(action) {
      case 'INSERT': return 'Добавление';
      case 'UPDATE': return 'Изменение';
      case 'DELETE': return 'Удаление';
      default: return action;
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'INSERT': return '#3fb950';
      case 'UPDATE': return '#d29922';
      case 'DELETE': return '#f85149';
      default: return '#888';
    }
  };

  if (loading) return <div className="loader">Загрузка...</div>;

  return (
    <div className="page">
      <h2>Журнал аудита</h2>
      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      
      <div className="table">
        <div className="row head">
          <div>Время</div>
          <div>Таблица</div>
          <div>Действие</div>
          <div>ID записи</div>
        </div>
        {logs.map(log => (
          <div className="row" key={log.id}>
            <div>{new Date(log.changed_at).toLocaleString()}</div>
            <div>{log.table_name}</div>
            <div>
              <span style={{
                background: getActionColor(log.action),
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#fff'
              }}>
                {getActionText(log.action)}
              </span>
            </div>
            <div>{log.record_id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Audit;