import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ErrorBlock from '../components/ErrorBlock';
import axios from 'axios';

function Item() {
  const { id } = useParams();
  const nav = useNavigate();
  const { current, loading, err, loadOne, clearErr } = useApp();
  const { user } = useAuth();
  const [notFound, setNotFound] = useState(false);
  const [loadedId, setLoadedId] = useState(null);
  const [relatedVulns, setRelatedVulns] = useState([]);
  const [relatedSources, setRelatedSources] = useState([]);

  const isAdmin = user?.role === 'Администратор';

  useEffect(() => {
    if (loadedId !== id) {
      setLoadedId(id);
      loadOne(id);
      setNotFound(false);
    }
  }, [id, loadOne, loadedId]);

  useEffect(() => {
    if (err === 'Запись не найдена') {
      setNotFound(true);
    }
  }, [err]);

  useEffect(() => {
    if (current && current.id) {
      axios.get(`/api/attacks/${current.id}/vulnerabilities`)
        .then(res => setRelatedVulns(res.data))
        .catch(err => console.error('Ошибка загрузки уязвимостей', err));

      axios.get(`/api/attacks/${current.id}/sources`)
        .then(res => setRelatedSources(res.data))
        .catch(err => console.error('Ошибка загрузки источников', err));
    }
  }, [current]);

  if (loading) {
    return <Loader text="Загрузка данных..." />;
  }

  if (notFound || err) {
    return (
      <div className="page">
        <ErrorBlock 
          msg={notFound ? 'Запись не найдена' : err} 
          onClose={() => {
            clearErr();
            nav('/list');
          }} 
        />
      </div>
    );
  }

  if (!current) {
    return null;
  }

  const getThreatLevelColor = (level) => {
    if (level <= 2) return '#3fb950';
    if (level <= 4) return '#d29922';
    return '#f85149';
  };

  return (
    <div className="page item">
      <div className="back">
        <Link to="/list">← Назад</Link>
      </div>

      <div className="item-card">
        <div className="title">
          <h2>{current.name}</h2>
          <span className={'type-big ' + current.type}>
            {current.type}
          </span>
        </div>

        <div className="grid">
          <div className="field">
            <span className="label">Дата</span>
            <span className="val">{current.date ? new Date(current.date).toLocaleDateString('ru-RU') : ''}</span>
          </div>
          <div className="field">
            <span className="label">Протокол</span>
            <span className="val proto">{current.protocol}</span>
          </div>
          <div className="field">
            <span className="label">Статус</span>
            <span className={'status-big ' + current.status}>
              {current.status}
            </span>
          </div>
          <div className="field">
            <span className="label">ID</span>
            <span className="val">#{current.id}</span>
          </div>
          <div className="field">
            <span className="label">Уровень угрозы</span>
            <span className="val" style={{ color: getThreatLevelColor(current.threat_level), fontWeight: 'bold' }}>
              {current.threat_level} / 5
            </span>
          </div>
        </div>

        <div className="desc-block">
          <h3>Описание</h3>
          <p>{current.description || current.desc}</p>
        </div>

        {relatedVulns.length > 0 && (
          <div className="desc-block">
            <h3>Связанные уязвимости</h3>
            {relatedVulns.map(v => (
              <div key={v.id} style={{ padding: '8px 0', borderBottom: '1px solid #2a2f38' }}>
                <strong>{v.vulnerability_type}</strong> - Статус: {v.patch_status === 'Fixed' ? 'Исправлена' : v.patch_status === 'Open' ? 'Открыта' : v.patch_status === 'Reopened' ? 'Переоткрыта' : 'В работе'}
              </div>
            ))}
          </div>
        )}

        {relatedSources.length > 0 && (
          <div className="desc-block">
            <h3>Источники инцидента</h3>
            {relatedSources.map(s => (
              <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid #2a2f38' }}>
                <strong>{s.source_name}</strong> - {s.source_type}
                {s.ip_address && <span> (IP: {s.ip_address})</span>}
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="actions">
            <Link to={'/change/' + current.id} className="btn edit">
              Редактировать
            </Link>
            <Link to={'/remove/' + current.id} className="btn delete">
              Удалить
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Item;