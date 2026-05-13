import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

function EmployeeForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    position: '',
    email: '',
    phone: '',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      axios.get(`/api/employees/${id}`).then(res => setForm(res.data));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (id) {
        await axios.put(`/api/employees/${id}`, form);
      } else {
        await axios.post('/api/employees', form);
      }
      nav('/employees');
    } catch (err) {
      setError('Ошибка при сохранении');
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>{id ? 'Редактировать' : 'Новый'} сотрудник</h2>
      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label>ФИО</label>
          <input name="full_name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
        </div>
        <div className="field">
          <label>Должность</label>
          <input name="position" value={form.position} onChange={e => setForm({...form, position: e.target.value})} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        </div>
        <div className="field">
          <label>Телефон</label>
          <input name="phone" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
        </div>
        <div className="field">
          <label>Отдел</label>
          <input name="department" value={form.department || ''} onChange={e => setForm({...form, department: e.target.value})} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn save" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
          <Link to="/employees" className="btn cancel">Отмена</Link>
        </div>
      </form>
    </div>
  );
}

export default EmployeeForm;