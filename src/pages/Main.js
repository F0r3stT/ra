import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import ErrorBlock from '../components/ErrorBlock';
import Statistics from '../components/Statistics';

function Main() {
  const { items, loading, err, loadAll, clearErr } = useApp();

useEffect(() => {
    loadAll();
}, [loadAll]);

  if (loading && items.length === 0) {
    return <Loader />;
  }

  const active = items.filter(x => x.status === 'Активна').length;
  const blocked = items.filter(x => x.status === 'Заблокирована').length;
  const external = items.filter(x => x.type === 'Внешняя').length;
  const internal = items.filter(x => x.type === 'Внутренняя').length;

  const last = [...items].reverse().slice(0, 5);

  return (
    <div className="page">
      <h2>Мониторинг атак</h2>
      
      {err && <ErrorBlock msg={err} onClose={clearErr} />}

      <div className="stats">
        <div className="card total">
          <span className="num">{items.length}</span>
          <span>Всего</span>
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

      <Statistics attacks={items} />

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
                <div>{x.date}</div>
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