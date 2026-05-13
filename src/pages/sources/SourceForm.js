import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

function SourceForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({
    source_name: '',
    source_type: 'System',
    ip_address: '',
    device_name: '',
    contact_info: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      axios.get(`/api/sources/${id}`).then(res => setForm(res.data));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (id) {
        await axios.put(`/api/sources/${id}`, form);
      } else {
        await axios.post('/api/sources', form);
      }
      nav('/sources');
    } catch (err) {
      setError('Ошибка при сохранении');
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>{id ? 'Редактировать' : 'Новый'} источник</h2>
      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label>Название источника</label>
          <input name="source_name" value={form.source_name} onChange={e => setForm({...form, source_name: e.target.value})} required />
        </div>
        <div className="field">
          <label>Тип источника</label>
          <select name="source_type" value={form.source_type} onChange={e => setForm({...form, source_type: e.target.value})}>
            <option value="System">Система</option>
            <option value="Device">Устройство</option>
            <option value="Person">Человек</option>
          </select>
        </div>
        <div className="field">
          <label>IP адрес</label>
          <input name="ip_address" value={form.ip_address || ''} onChange={e => setForm({...form, ip_address: e.target.value})} placeholder="192.168.1.1" />
        </div>
        <div className="field">
          <label>Название устройства</label>
          <input name="device_name" value={form.device_name || ''} onChange={e => setForm({...form, device_name: e.target.value})} />
        </div>
        <div className="field">
          <label>Контактная информация</label>
          <input name="contact_info" value={form.contact_info || ''} onChange={e => setForm({...form, contact_info: e.target.value})} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn save" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
          <Link to="/sources" className="btn cancel">Отмена</Link>
        </div>
      </form>
    </div>
  );
}

export default SourceForm;