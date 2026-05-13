import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import ErrorBlock from '../components/ErrorBlock';
import axios from 'axios';

const allowedProtocols = [
  'HTTP', 'HTTPS', 'DNS', 'SS7', 'SIP', 'SMTP', 'FTP', 'SSH', 'TELNET', 'SNMP'
];

function Change() {
  const { id } = useParams();
  const nav = useNavigate();
  const { current, loading, err, loadOne, changeItem, clearErr } = useApp();

  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [sources, setSources] = useState([]);
  const [existingVulns, setExistingVulns] = useState([]);
  const [existingSources, setExistingSources] = useState([]);
  const [form, setForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // 1. Загружаем все доступные уязвимости и источники (чтобы нарисовать чекбоксы)
    axios.get('/api/vulnerabilities').then(res => setVulnerabilities(res.data)).catch(console.error);
    axios.get('/api/sources').then(res => setSources(res.data)).catch(console.error);
    
    // 2. Используем наши новые правильные роуты для получения УЖЕ выбранных связей!
    axios.get(`/api/attacks/${id}/vulnerabilities`).then(res => {
      setExistingVulns(res.data.map(v => v.id)); // Берем только id
    }).catch(console.error);
    
    axios.get(`/api/attacks/${id}/sources`).then(res => {
      setExistingSources(res.data.map(s => s.id)); // Берем только id
    }).catch(console.error);
    
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
        threat_level: String(current.threat_level || 3),
        date: current.date ? current.date.slice(0,10) : '',
        status: current.status,
        vulnerability_ids: existingVulns,
        source_ids: existingSources
      });
    }
  }, [current, existingVulns, existingSources]);

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
      errs.protocol = 'Обязательное поле';
    } else {
      const upperProtocol = form.protocol.trim().toUpperCase();
      if (!allowedProtocols.includes(upperProtocol)) {
        errs.protocol = 'Допустимые протоколы: ' + allowedProtocols.join(', ');
      }
    }

    const threat = Number(form.threat_level);
    if (threat < 1 || threat > 5) {
      errs.threat_level = 'Уровень угрозы должен быть от 1 до 5';
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
      threat_level: Number(form.threat_level),
      status: form.status,
      date: form.date, 
      vulnerability_ids: form.vulnerability_ids,
      source_ids: form.source_ids
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

          <div className="field">
            <label>Дата</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
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
                  checked={form.vulnerability_ids?.includes(v.id) || false}
                  onChange={handleChange}
                />
                {v.vulnerability_type} [{v.patch_status === 'Fixed' ? 'Исправлена' : v.patch_status === 'Open' ? 'Открыта' : v.patch_status === 'Reopened' ? 'Переоткрыта' : 'В работе'}]
              </label>
            ))}
          </div>
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
                  checked={form.source_ids?.includes(s.id) || false}
                  onChange={handleChange}
                />
                {s.source_name} ({s.source_type === 'System' ? 'Система' : s.source_type === 'Device' ? 'Устройство' : 'Человек'})
              </label>
            ))}
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