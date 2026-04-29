import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import ErrorBlock from '../components/ErrorBlock';

function Item() {
  const { id } = useParams();
  const nav = useNavigate();
  const { current, loading, err, loadOne, clearErr } = useApp();
  const [notFound, setNotFound] = useState(false);
  const [loadedId, setLoadedId] = useState(null);

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
            <span className="val">{current.date ? current.date.slice(0,10) : ''}</span>
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
        </div>

        <div className="desc-block">
          <h3>Описание</h3>
          <p>{current.description || current.desc}</p>
        </div>

        <div className="actions">
          <Link to={'/change/' + current.id} className="btn edit">
            Редактировать
          </Link>
          <Link to={'/remove/' + current.id} className="btn delete">
            Удалить
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Item;