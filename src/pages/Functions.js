import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Functions() {
  const [periodCount, setPeriodCount] = useState(null);
  const [avgTime, setAvgTime] = useState(null);
  const [topVulns, setTopVulns] = useState([]);
  
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [year, setYear] = useState(2026);
  const [quarter, setQuarter] = useState(1);
  
  // Для выбора сотрудника
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // При загрузке страницы получаем список сотрудников
  useEffect(() => {
    axios.get('/api/employees')
      .then(res => {
        setEmployees(res.data);
        if (res.data.length > 0) setSelectedEmployee(res.data[0].id);
      })
      .catch(err => console.error('Ошибка загрузки сотрудников:', err));
  }, []);

  const handleCountIncidents = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`/api/count-by-period?start=${startDate}&end=${endDate}`);
      setPeriodCount(res.data.count);
    } catch (err) { setError('Ошибка при подсчете инцидентов'); } 
    finally { setLoading(false); }
  };

  const handleAvgResponseTime = async () => {
    if (!selectedEmployee) {
      setError('Пожалуйста, добавьте и выберите сотрудника');
      return;
    }
    setLoading(true); setError('');
    try {
      // Теперь ID сотрудника берется из выпадающего списка
      const res = await axios.get(`/api/avg-response-time?employee_id=${selectedEmployee}&start=${startDate}&end=${endDate}`);
      setAvgTime(res.data.avg_hours);
    } catch (err) { setError('Ошибка при расчете времени реагирования'); } 
    finally { setLoading(false); }
  };

  const handleTopVulnerabilities = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`/api/top-vulnerabilities?year=${year}&quarter=${quarter}`);
      setTopVulns(res.data);
    } catch (err) { setError('Ошибка при получении уязвимостей'); } 
    finally { setLoading(false); }
  };

  // Функция для красивого вывода времени (часы и минуты)
const formatTime = (hoursDecimal) => {
    if (!hoursDecimal || hoursDecimal === 0) return '0 часов 0 минут';
    const h = Math.floor(hoursDecimal);
    const m = Math.round((hoursDecimal - h) * 60);
    return `${h} час. ${m} мин.`;
  };

  return (
    <div className="page">
      <h2>Пользовательские функции</h2>
      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      
      <div className="stats" style={{ marginBottom: '30px' }}>
        
        {/* Функция 1 */}
        <div className="card">
          <h3>Подсчет инцидентов за период</h3>
          <div className="row" style={{ marginBottom: '15px', gap: '10px', flexWrap: 'wrap' }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px', background: '#1a1e24', border: '1px solid #2a2f38', color: '#fff', borderRadius: '4px' }} />
            <span style={{paddingTop: '8px'}}>—</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px', background: '#1a1e24', border: '1px solid #2a2f38', color: '#fff', borderRadius: '4px' }} />
            <button onClick={handleCountIncidents} className="btn" disabled={loading}>Выполнить</button>
          </div>
          {periodCount !== null && <p><strong>Результат:</strong> {periodCount} шт.</p>}
        </div>

        {/* Функция 2 */}
        <div className="card">
          <h3>Среднее время реагирования</h3>
          <div className="row" style={{ marginBottom: '15px', gap: '10px', flexWrap: 'wrap' }}>
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} style={{ padding: '8px', background: '#1a1e24', border: '1px solid #2a2f38', color: '#fff', borderRadius: '4px', minWidth: '200px' }}>
              <option value="">Выберите сотрудника</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
            <button onClick={handleAvgResponseTime} className="btn" disabled={loading || !selectedEmployee}>Выполнить</button>
          </div>
          {avgTime !== null && <p style={{ marginTop: '15px' }}><strong>Результат:</strong> {formatTime(avgTime)}</p>}
        </div>

        {/* Функция 3 */}
        <div className="card">
          <h3>Топ уязвимостей за квартал</h3>
          <div className="row" style={{ marginBottom: '15px', gap: '10px', flexWrap: 'wrap' }}>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: '80px', padding: '8px', background: '#1a1e24', border: '1px solid #2a2f38', color: '#fff', borderRadius: '4px' }} />
            <select value={quarter} onChange={e => setQuarter(Number(e.target.value))} style={{ padding: '8px', background: '#1a1e24', border: '1px solid #2a2f38', color: '#fff', borderRadius: '4px' }}>
              <option value="1">1 квартал (янв-март)</option>
              <option value="2">2 квартал (апр-июн)</option>
              <option value="3">3 квартал (июл-сен)</option>
              <option value="4">4 квартал (окт-дек)</option>
            </select>
            <button onClick={handleTopVulnerabilities} className="btn" disabled={loading}>Выполнить</button>
          </div>
          {topVulns.length > 0 ? (
            <div style={{marginTop: '10px'}}>
              {topVulns.map((v, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #2a2f38' }}>
                  <strong>{i+1}. {v.vuln_type}</strong> — {v.occurrence_count} шт. (Ср. угроза: {Number(v.avg_threat_level).toFixed(1)})
                </div>
              ))}
            </div>
          ) : (
             topVulns && year && !loading && <p style={{color: '#888'}}>Нет данных за этот период</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Functions;