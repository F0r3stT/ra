import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import ErrorBlock from '../components/ErrorBlock';

function List() {
  const { items, loading, err, loadAll, clearErr } = useApp();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading && items.length === 0) {
    return <Loader text="Загрузка списка..." />;
  }

  return (
    <div className="page">
      <h2>Все атаки</h2>

      {err && <ErrorBlock msg={err} onClose={clearErr} />}

      {items.length === 0 ? (
        <div className="empty">
          <p>Атаки не зафиксированы</p>
          <Link to="/create" className="btn">Добавить первую</Link>
        </div>
      ) : (
        <div className="cards">
          {items.map(x => (
            <Link to={'/item/' + x.id} className="card" key={x.id}>
              <div className="head">
                <span className={'type ' + x.type}>
                  {x.type}
                </span>
                <span className="date">{x.date ? x.date.slice(0,10) : ''}</span>
              </div>
              <h3>{x.name}</h3>
              <div className="meta">
                <span className="proto">{x.protocol}</span>
                <span className={'status ' + x.status}>
                  {x.status}
                </span>
              </div>
              <p className="desc">{(x.description || x.desc || '').substring(0, 80)}...</p>
              <div className="more">Подробнее →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default List;