import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Словарь для перевода системных названий полей на русский
const FIELD_NAMES = {
  name: 'Название',
  status: 'Статус',
  threat_level: 'Уровень угрозы',
  description: 'Описание',
  protocol: 'Протокол',
  type: 'Тип',
  source_name: 'Имя источника',
  ip_address: 'IP адрес',
  vulnerability_type: 'Уязвимость',
  patch_status: 'Статус патча',
  closed_at: 'Время закрытия'
};

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
      case 'INSERT': return 'СОЗДАНИЕ';
      case 'UPDATE': return 'ИЗМЕНЕНИЕ';
      case 'DELETE': return 'УДАЛЕНИЕ';
      default: return action;
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'INSERT': return '#3fb950'; // Зеленый
      case 'UPDATE': return '#d29922'; // Желтый
      case 'DELETE': return '#f85149'; // Красный
      default: return '#888';
    }
  };

  const getTableName = (table) => {
    switch(table) {
      case 'incidents': return 'Инциденты';
      case 'vulnerabilities': return 'Уязвимости';
      case 'incident_sources': return 'Источники';
      case 'response_measures': return 'Меры реагирования';
      case 'employees': return 'Сотрудники';
      default: return table;
    }
  };

  // Функция для умного анализа того, что именно изменилось
  const renderDetails = (log) => {
    const oldData = log.old_data || {};
    const newData = log.new_data || {};
    
    // Ищем главное имя записи (название инцидента, уязвимости и т.д.)
    const recordName = newData.name || newData.source_name || newData.vulnerability_type || oldData.name || oldData.source_name || oldData.vulnerability_type || `ID: ${log.record_id}`;

    if (log.action === 'INSERT') {
      return <div style={{ color: '#8b949e' }}>Добавлена новая запись: <strong style={{ color: '#e6edf3' }}>{recordName}</strong></div>;
    }

    if (log.action === 'DELETE') {
      return <div style={{ color: '#8b949e' }}>Безвозвратно удалено: <strong style={{ color: '#f85149' }}>{recordName}</strong></div>;
    }

    if (log.action === 'UPDATE') {
      const changes = [];
      // Сравниваем старые и новые данные
      for (let key in newData) {
        if (oldData[key] !== newData[key] && key !== 'updated_at' && key !== 'created_at') {
          const fieldName = FIELD_NAMES[key] || key;
          const oldVal = oldData[key] === null ? 'Пусто' : oldData[key];
          const newVal = newData[key] === null ? 'Пусто' : newData[key];
          
          changes.push(
            <div key={key} style={{ marginTop: '4px', fontSize: '13px' }}>
              <span style={{ color: '#8b949e' }}>{fieldName}:</span>{' '}
              <span style={{ textDecoration: 'line-through', color: '#f85149', marginRight: '5px' }}>{oldVal}</span> 
              ➔{' '}
              <span style={{ color: '#3fb950', fontWeight: 'bold' }}>{newVal}</span>
            </div>
          );
        }
      }

      if (changes.length === 0) return <div style={{ color: '#8b949e' }}>Системное обновление (без изменения данных)</div>;

      return (
        <div>
          <div style={{ color: '#e6edf3', marginBottom: '4px' }}>Обновлена запись: <strong>{recordName}</strong></div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', borderLeft: '2px solid #d29922' }}>
            {changes}
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) return <div className="loader">Загрузка журнала...</div>;

  return (
    <div className="page">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8ab4f8" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        Журнал системного аудита
      </h2>
      <p style={{ color: '#8b949e', marginBottom: '25px' }}>
        Здесь фиксируются все изменения в базе данных. Логи защищены от удаления и доступны только администраторам.
      </p>

      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {logs.map(log => (
          <div key={log.id} style={{ 
            background: '#161b22', 
            border: '1px solid #30363d', 
            borderRadius: '8px', 
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Верхняя часть: Мета-информация */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{
                  background: `${getActionColor(log.action)}20`,
                  color: getActionColor(log.action),
                  border: `1px solid ${getActionColor(log.action)}50`,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px'
                }}>
                  {getActionText(log.action)}
                </span>
                <span style={{ color: '#8ab4f8', fontWeight: '500', fontSize: '14px' }}>
                  {getTableName(log.table_name)}
                </span>
              </div>
              <div style={{ color: '#8b949e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {new Date(log.changed_at).toLocaleString('ru-RU')}
              </div>
            </div>

            {/* Нижняя часть: Детали изменений */}
            <div style={{ paddingLeft: '5px' }}>
              {renderDetails(log)}
            </div>
            
            {/* Инициатор */}
            <div style={{ fontSize: '11px', color: '#6e7681', textAlign: 'right', marginTop: '-5px' }}>
              Пользователь БД: {log.changed_by || 'system'}
            </div>
          </div>
        ))}
        {logs.length === 0 && <div style={{ textAlign: 'center', color: '#8b949e', padding: '30px' }}>Журнал пуст</div>}
      </div>
    </div>
  );
}

export default Audit;