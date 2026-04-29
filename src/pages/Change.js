import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import ErrorBlock from '../components/ErrorBlock';

const allowedProtocols = [
  'HTTP', 'HTTPS', 'DNS', 'SS7', 'SIP', 'SMTP', 'FTP', 'SSH', 'TELNET', 'SNMP'
];

function Change() {
  const { id } = useParams();
  const nav = useNavigate();
  const { current, loading, err, loadOne, changeItem, clearErr } = useApp();

  const [form, setForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadOne(id);
  }, [id, loadOne]);

  useEffect(() => {
    if (err === 'Запись не найдена') {
      setNotFound(true);
    }
  }, [err]);

  useEffect(() => {
    if (current) {
      setForm({
        id: current.id,
        name: current.name,
        desc: current.description || current.desc || '',
        type: current.type,
        protocol: current.protocol,
        threat_level: current.threat_level || 3,
        date: current.date ? current.date.slice(0,10) : '',
        status: current.status
      });
    }
  }, [current]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const errs = {};

    if (!form.name.trim()) {
      errs.name = 'Обязательное поле';
    } else if (form.name.length < 3) {
      errs.name = 'Минимум 3 символа';
    }

    if (!form.desc.trim()) {
      errs.desc = 'Обязательное поле';
    } else if (form.desc.length < 10) {
      errs.desc = 'Минимум 10 символов';
    }

    if (!form.protocol.trim()) {
      errs.protocol = 'Обязательное поле';
    } else {
      const upperProtocol = form.protocol.trim().toUpperCase();
      if (!allowedProtocols.includes(upperProtocol)) {
        errs.protocol = 'Допустимые протоколы: ' + allowedProtocols.join(', ');
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const toSend = {
      name: form.name,
      description: form.desc,
      type: form.type,
      protocol: form.protocol.toUpperCase(),
      threat_level: Number(form.threat_level) || 3,
      status: form.status
    };

    setSaving(true);
    const ok = await changeItem(id, toSend);
    setSaving(false);

    if (ok) nav('/item/' + id);
  }

  if (loading && !form) {
    return <Loader />;
  }

  if (notFound || (err && !form)) {
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

  if (!form) {
    return null;
  }

  return (
    <div className="page">
      <h2>Редактирование</h2>

      {err && <ErrorBlock msg={err} onClose={clearErr} />}

      <form onSubmit={handleSubmit} className="form">
        <div className={'field ' + (fieldErrors.name ? 'bad' : '')}>
          <label>Название</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          {fieldErrors.name && <span className="ferr">{fieldErrors.name}</span>}
        </div>

        <div className={'field ' + (fieldErrors.desc ? 'bad' : '')}>
          <label>Описание</label>
          <textarea
            name="desc"
            value={form.desc}
            onChange={handleChange}
            rows="4"
          />
          {fieldErrors.desc && <span className="ferr">{fieldErrors.desc}</span>}
        </div>

        <div className="row">
          <div className="field">
            <label>Тип</label>
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="Внешняя">Внешняя</option>
              <option value="Внутренняя">Внутренняя</option>
            </select>
          </div>

          <div className={'field ' + (fieldErrors.protocol ? 'bad' : '')}>
            <label>Протокол</label>
            <input
              name="protocol"
              value={form.protocol}
              onChange={handleChange}
            />
            {fieldErrors.protocol && <span className="ferr">{fieldErrors.protocol}</span>}
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Дата</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Статус</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Активна">Активна</option>
              <option value="Заблокирована">Заблокирована</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn update" disabled={saving}>
            {saving ? 'Обновление...' : 'Обновить'}
          </button>
          <Link to={'/item/' + id} className="btn cancel">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Change;