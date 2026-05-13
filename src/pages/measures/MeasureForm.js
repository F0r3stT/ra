import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

function MeasureForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    measure_name: '',
    measure_type: '',
    description: '',
    incident_id: '',
    employee_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/incidents').then(res => setIncidents(res.data));
    axios.get('/api/employees').then(res => setEmployees(res.data));
    if (id) {
      axios.get(`/api/measures/${id}`).then(res => setForm(res.data));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (id) {
        await axios.put(`/api/measures/${id}`, form);
      } else {
        await axios.post('/api/measures', form);
      }
      nav('/measures');
    } catch (err) {
      setError('Ошибка при сохранении');
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>{id ? 'Редактировать' : 'Новая'} мера реагирования</h2>
      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label>Название меры</label>
          <input name="measure_name" value={form.measure_name} onChange={e => setForm({...form, measure_name: e.target.value})} required />
        </div>
        <div className="field">
          <label>Тип меры</label>
          <input name="measure_type" value={form.measure_type} onChange={e => setForm({...form, measure_type: e.target.value})} required />
        </div>
        <div className="field">
          <label>Описание</label>
          <textarea name="description" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows="3" />
        </div>
        <div className="row">
          <div className="field">
            <label>Инцидент</label>
            <select name="incident_id" value={form.incident_id || ''} onChange={e => setForm({...form, incident_id: e.target.value})}>
              <option value="">— Не выбрано —</option>
              {incidents.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Сотрудник</label>
            <select name="employee_id" value={form.employee_id || ''} onChange={e => setForm({...form, employee_id: e.target.value})}>
              <option value="">— Не выбрано —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn save" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
          <Link to="/measures" className="btn cancel">Отмена</Link>
        </div>
      </form>
    </div>
  );
}

export default MeasureForm;