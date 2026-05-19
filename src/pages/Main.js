import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ErrorBlock from '../components/ErrorBlock';
import Statistics from '../components/Statistics';
import axios from 'axios';

function Main({ showToast }) {
  const [employees, setEmployees] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [sources, setSources] = useState([]);
  const { user } = useAuth();
  const location = useLocation();
  const [redirectError, setRedirectError] = useState('');
  const isAdmin = user?.role === 'Администратор' || user?.role === 'admin' || user?.role === 'Admin';
  const { items, loading, err, loadAll, clearErr } = useApp();

  useEffect(() => {
    if (location.state?.error) {
      setRedirectError(location.state.error);
      setTimeout(() => setRedirectError(''), 3000);
    }
  }, [location]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;
      try {
        const [employeesRes, vulnsRes, measuresRes, sourcesRes] = await Promise.all([
          axios.get('/api/employees'),
          axios.get('/api/vulnerabilities'),
          axios.get('/api/measures'),
          axios.get('/api/sources')
        ]);
        setEmployees(employeesRes.data);
        setVulnerabilities(vulnsRes.data);
        setMeasures(measuresRes.data);
        setSources(sourcesRes.data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };
    fetchData();
  }, [isAdmin]);

  const active = items.filter(x => x.status === 'Активна').length;
  const blocked = items.filter(x => x.status === 'Заблокирована').length;
  const external = items.filter(x => x.type === 'Внешняя').length;
  const internal = items.filter(x => x.type === 'Внутренняя').length;

  const last = [...items].reverse().slice(0, 5);

  if (loading && items.length === 0) {
    return <Loader />;
  }

  return (
    <div className="page">
      {redirectError && (
        <div className="error" style={{ marginBottom: '20px' }}>
          <span>{redirectError}</span>
          <button onClick={() => setRedirectError('')} className="close">×</button>
        </div>
      )}

      {err && <ErrorBlock msg={err} onClose={clearErr} />}

      <h2>Мониторинг атак</h2>

      <Statistics attacks={items} />

      <div className="stats">
        <div className="card total">
          <span className="num">{items.length}</span>
          <span>Всего инцидентов</span>
        </div>
        <div className="card active">
          <span className="num">{active}</span>
          <span>Активных</span>
        </div>
        <div className="card blocked">
          <span className="num">{blocked}</span>
          <span>Заблокировано</span>
        </div>
        <div className="card external">
          <span className="num">{external}</span>
          <span>Внешних</span>
        </div>
        <div className="card internal">
          <span className="num">{internal}</span>
          <span>Внутренних</span>
        </div>
      </div>

      {isAdmin && (
        <>
          <div className="stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="card">
              <h3>Сотрудники</h3>
              <span className="num">{employees.length}</span>
              <span>человек в службе безопасности</span>
              <Link to="/employees" style={{ display: 'block', marginTop: '15px', color: '#8ab4f8' }}>Управление →</Link>
            </div>
            <div className="card">
              <h3>Источники инцидентов</h3>
              <span className="num">{sources.length}</span>
              <span>источников</span>
              <Link to="/sources" style={{ display: 'block', marginTop: '15px', color: '#8ab4f8' }}>Управление →</Link>
            </div>
          </div>

          <div className="stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="card">
              <h3>Меры реагирования</h3>
              <span className="num">{measures.length}</span>
              <span>применено мер</span>
              <Link to="/measures" style={{ display: 'block', marginTop: '15px', color: '#8ab4f8' }}>Управление →</Link>
            </div>
            <div className="card">
              <h3>Уязвимости</h3>
              <span className="num">{vulnerabilities.length}</span>
              <span>зарегистрировано</span>
              <Link to="/vulnerabilities" style={{ display: 'block', marginTop: '15px', color: '#8ab4f8' }}>Управление →</Link>
            </div>
          </div>

          <div className="stats" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
            <div className="card">
              <h3>Журнал аудита</h3>
              <span className="num">все изменения</span>
              <span>отслеживаются</span>
              <Link to="/audit" style={{ display: 'block', marginTop: '15px', color: '#8ab4f8' }}>Просмотр →</Link>
            </div>
          </div>
        </>
      )}

      <div className="last">
        <h3>Последние атаки</h3>
        {items.length === 0 ? (
          <p>Нет данных</p>
        ) : (
          <div className="table">
            <div className="row head">
              <div>Название</div>
              <div>Протокол</div>
              <div>Тип</div>
              <div>Статус</div>
              <div>Дата</div>
            </div>
            {last.map(x => (
              <div className="row" key={x.id}>
                <div>{x.name}</div>
                <div>{x.protocol}</div>
                <div>{x.type}</div>
                <div>
                  <span className={'status ' + x.status}>
                    {x.status}
                  </span>
                </div>
                <div>{x.date ? new Date(x.date).toLocaleDateString('ru-RU') : ''}</div>
              </div>
            ))}
          </div>
        )}
        <p className="hint">
          <Link to="/list">Смотреть все →</Link>
        </p>
      </div>
    </div>
  );
}

export default Main;