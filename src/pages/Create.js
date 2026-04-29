import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import ErrorBlock from '../components/ErrorBlock';

const allowedProtocols = [
  'HTTP', 'HTTPS', 'DNS', 'SS7', 'SIP', 'SMTP', 'FTP', 'SSH', 'TELNET', 'SNMP'
];

function Create() {
  const nav = useNavigate();
  const { addItem, loading, err, clearErr } = useApp();

  const [form, setForm] = useState({
    name: '',
    desc: '',
    type: 'Внешняя',
    protocol: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Активна'
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

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
      errs.protocol = 'Укажите протокол';
    } else {
      const upperProtocol = form.protocol.trim().toUpperCase();
      if (!allowedProtocols.includes(upperProtocol)) {
        errs.protocol = 'Допустимые протоколы: ' + allowedProtocols.join(', ');
      }
    }

    if (!form.date) {
      errs.date = 'Укажите дату';
    } else {
      const d = new Date(form.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (d > today) {
        errs.date = 'Дата не может быть в будущем';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setValidating(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const isValid = validate();
    setValidating(false);

    if (!isValid) return;

    const toSend = {
      name: form.name,
      description: form.desc,
      type: form.type,
      protocol: form.protocol.toUpperCase(),
      threat_level: 3,
      status: form.status
    };

    setSaving(true);
    const ok = await addItem(toSend);
    setSaving(false);

    if (ok) nav('/list');
  }

  if (saving || loading || validating) {
    return <Loader />;
  }

  return (
    <div className="page">
      <h2>Новая атака</h2>

      {err && <ErrorBlock msg={err} onClose={clearErr} />}

      <form onSubmit={handleSubmit} className="form">
        <div className={'field ' + (fieldErrors.name ? 'bad' : '')}>
          <label>Название</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Например: SQL инъекция"
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
            placeholder="Подробное описание..."
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
              placeholder="HTTP, DNS, SS7..."
            />
            {fieldErrors.protocol && <span className="ferr">{fieldErrors.protocol}</span>}
          </div>
        </div>

        <div className="row">
          <div className={'field ' + (fieldErrors.date ? 'bad' : '')}>
            <label>Дата</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
            {fieldErrors.date && <span className="ferr">{fieldErrors.date}</span>}
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
          <button type="submit" className="btn save" disabled={saving || validating}>
            {saving ? 'Сохранение...' : validating ? 'Проверка...' : 'Сохранить'}
          </button>
          <Link to="/list" className="btn cancel">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Create;