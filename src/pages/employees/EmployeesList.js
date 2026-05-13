import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data);
    } catch (err) {
      setError('Ошибка загрузки сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить сотрудника?')) {
      try {
        await axios.delete(`/api/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        setError('Не удалось удалить сотрудника');
      }
    }
  };

  if (loading) return <div className="loader">Загрузка...</div>;

  return (
    <div className="page">
      <h2>Сотрудники</h2>
      {error && <div className="error">{error}<button onClick={() => setError('')} className="close">×</button></div>}
      <Link to="/employees/create" className="btn save" style={{ marginBottom: '20px' }}>+ Добавить сотрудника</Link>
      
      <div className="cards">
        {employees.map(e => (
          <div className="card" key={e.id}>
            <h3>{e.full_name}</h3>
            <div className="meta">
              <span>{e.position}</span>
              <span>{e.department}</span>
            </div>
            <p>Email: {e.email}</p>
            <p>Телефон: {e.phone || '—'}</p>
            <div className="actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <Link to={`/employees/edit/${e.id}`} className="btn edit">Редактировать</Link>
              <button onClick={() => handleDelete(e.id)} className="btn delete">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmployeesList;