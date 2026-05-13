import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import ErrorBlock from '../components/ErrorBlock';
import axios from 'axios';

const allowedProtocols = [
  'HTTP', 'HTTPS', 'DNS', 'SS7', 'SIP', 'SMTP', 'FTP', 'SSH', 'TELNET', 'SNMP'
];

function Create() {
  const nav = useNavigate();
  const { addItem, loading, err, clearErr } = useApp();

  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [sources, setSources] = useState([]);

  const [form, setForm] = useState({
    name: '',
    desc: '',
    type: 'Внешняя',
    protocol: '',
    threat_level: '3',
    date: new Date().toISOString().split('T')[0],
    status: 'Активна',
    vulnerability_ids: [],
    source_ids: []
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

useEffect(() => {
  axios.get('/api/vulnerabilities')
    .then(res => setVulnerabilities(res.data))
    .catch(err => console.error('Нет доступа к уязвимостям:', err));
    
  axios.get('/api/sources')
    .then(res => setSources(res.data))
    .catch(err => console.error('Нет доступа к источникам:', err));
}, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'vulnerability_ids') {
        const newIds = checked
          ? [...form.vulnerability_ids, parseInt(value)]
          : form.vulnerability_ids.filter(id => id !== parseInt(value));
        setForm(prev => ({ ...prev, vulnerability_ids: newIds }));
      } else if (name === 'source_ids') {
        const newIds = checked
          ? [...form.source_ids, parseInt(value)]
          : form.source_ids.filter(id => id !== parseInt(value));
        setForm(prev => ({ ...prev, source_ids: newIds }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
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

    const threat = Number(form.threat_level);
    if (isNaN(threat) || threat < 1 || threat > 5) {
      errs.threat_level = 'Уровень угрозы должен быть от 1 до 5';
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
      threat_level: Number(form.threat_level),
      status: form.status,
      date: form.date, 
      vulnerability_ids: form.vulnerability_ids,
      source_ids: form.source_ids
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
          <div className={'field ' + (fieldErrors.threat_level ? 'bad' : '')}>
            <label>Уровень угрозы (1-5)</label>
            <select name="threat_level" value={form.threat_level} onChange={handleChange}>
              <option value="1">1 - Низкий</option>
              <option value="2">2 - Ниже среднего</option>
              <option value="3">3 - Средний</option>
              <option value="4">4 - Высокий</option>
              <option value="5">5 - Критический</option>
            </select>
            {fieldErrors.threat_level && <span className="ferr">{fieldErrors.threat_level}</span>}
          </div>

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
        </div>

        <div className="row">
          <div className="field">
            <label>Статус</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Активна">Активна</option>
              <option value="Заблокирована">Заблокирована</option>
              <option value="Закрыта">Закрыта</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Связанные уязвимости</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
            {vulnerabilities.map(v => (
              <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  name="vulnerability_ids"
                  value={v.id}
                  checked={form.vulnerability_ids.includes(v.id)}
                  onChange={handleChange}
                />
                {v.vulnerability_type} [{v.patch_status === 'Fixed' ? 'Исправлена' : v.patch_status === 'Open' ? 'Открыта' : v.patch_status === 'Reopened' ? 'Переоткрыта' : 'В работе'}]
              </label>
            ))}
          </div>
          {vulnerabilities.length === 0 && <span className="ferr">Нет доступных уязвимостей. Добавьте их на странице "Уязвимости"</span>}
        </div>

        <div className="field">
          <label>Источники инцидента</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
            {sources.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  name="source_ids"
                  value={s.id}
                  checked={form.source_ids.includes(s.id)}
                  onChange={handleChange}
                />
                {s.source_name} ({s.source_type === 'System' ? 'Система' : s.source_type === 'Device' ? 'Устройство' : 'Человек'})
              </label>
            ))}
          </div>
          {sources.length === 0 && <span className="ferr">Нет доступных источников. Добавьте их на странице "Источники"</span>}
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