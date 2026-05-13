import React, { useEffect, useState } from 'react';
import axios from 'axios';

function IncidentVulnerabilities() {
  const [links, setLinks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState('');
  const [selectedVulnerability, setSelectedVulnerability] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const linksRes = await axios.get('/api/incident-vulnerabilities');
    const incidentsRes = await axios.get('/api/incidents');
    const vulnsRes = await axios.get('/api/vulnerabilities');
    setLinks(linksRes.data);
    setIncidents(incidentsRes.data);
    setVulnerabilities(vulnsRes.data);
  };

  const handleAdd = async () => {
    if (!selectedIncident || !selectedVulnerability) {
      setError('Выберите инцидент и уязвимость');
      return;
    }
    setError('');
    setMessage('');
    try {
      await axios.post('/api/incident-vulnerabilities', {
        incident_id: selectedIncident,
        vulnerability_id: selectedVulnerability
      });
      setMessage('Связь добавлена. Триггер проверит статус уязвимости');
      fetchData();
      setSelectedIncident('');
      setSelectedVulnerability('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка при добавлении связи';
      setError(errorMsg);
    }
  };

  const handleDelete = async (incident_id, vulnerability_id) => {
    try {
      await axios.delete('/api/incident-vulnerabilities', {
        data: { incident_id, vulnerability_id }
      });
      fetchData();
    } catch (err) {
      setError('Ошибка при удалении связи');
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
      case 'Fixed': return '#3fb950';
      case 'Reopened': return '#db6d28';
      case 'Open': return '#f85149';
      default: return '#d29922';
    }
  };

  return (
    <div className="page">
      <h2>Связь инцидентов с уязвимостями</h2>
      
      {message && <div className="success" style={{ background: '#1a2d1a', color: '#3fb950', padding: '12px', marginBottom: '20px', borderRadius: '6px' }}>{message}</div>}
      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}<button onClick={() => setError('')} className="close">×</button></div>}

      <div className="form" style={{ marginBottom: '30px' }}>
        <div className="row">
          <div className="field">
            <label>Инцидент</label>
            <select value={selectedIncident} onChange={e => setSelectedIncident(e.target.value)}>
              <option value="">Выберите инцидент</option>
              {incidents.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Уязвимость</label>
            <select value={selectedVulnerability} onChange={e => setSelectedVulnerability(e.target.value)}>
              <option value="">Выберите уязвимость</option>
              {vulnerabilities.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vulnerability_type} [{getStatusText(v.patch_status)}]
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button onClick={handleAdd} className="btn save">Добавить связь</button>
        </div>
      </div>

      <div className="info" style={{ background: '#1a1e24', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
        <strong>О триггере:</strong> Если уязвимость имеет статус "Исправлена" и вы связываете её с инцидентом, 
        статус автоматически изменится на "Переоткрыта". Это позволяет отслеживать, что исправленная уязвимость 
        снова стала актуальной.
      </div>

      <h3>Существующие связи</h3>
      <div className="table">
        <div className="row head">
          <div>Инцидент</div>
          <div>Уязвимость</div>
          <div>Статус уязвимости</div>
          <div>Действие</div>
        </div>
        {links.map(link => (
          <div className="row" key={`${link.incident_id}-${link.vulnerability_id}`}>
            <div>{link.incident_name}</div>
            <div>{link.vulnerability_type}</div>
            <div>
              <span style={{
                background: getStatusColor(link.patch_status),
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#fff'
              }}>
                {getStatusText(link.patch_status)}
              </span>
            </div>
            <div>
              <button onClick={() => handleDelete(link.incident_id, link.vulnerability_id)} className="btn delete" style={{ padding: '4px 12px' }}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IncidentVulnerabilities;