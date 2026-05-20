import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ForceGraph2D from 'react-force-graph-2d';
import ErrorBlock from '../components/ErrorBlock';
import axios from 'axios';

function Item() {
  const { id } = useParams();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const nav = useNavigate();
  const [selectedNode, setSelectedNode] = useState(null);
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
      
      // Загрузка данных для графа
      axios.get(`/api/attacks/${current.id}/graph`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => setGraphData(res.data))
      .catch(err => console.error('Ошибка загрузки графа', err));
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
                <strong>{v.vulnerability_type}</strong> - Статус: {v.patch_status === 'Исправлена' ? 'Исправлена' : v.patch_status === 'Открыта' ? 'Открыта' : v.patch_status === 'Переоткрыта' ? 'Переоткрыта' : 'В работе'}
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

        {graphData.nodes.length > 1 && (
          <div className="desc-block" style={{ position: 'relative' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              Интерактивная карта атаки
            </h3>
            <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '15px' }}>
               Нажмите на любой узел, чтобы просмотреть подробную информацию о нём.
            </p>
            
            <div style={{ 
              position: 'relative', height: '500px', borderRadius: '16px', overflow: 'hidden', 
              border: '1px solid #1f2937', 
              background: 'radial-gradient(circle at center, #0d1117 0%, #010409 100%)', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
            }}>
              
              {/* Информационная панель (Стиль Glassmorphism) */}
              {selectedNode && (
                <div style={{ 
                  position: 'absolute', top: '20px', right: '20px', zIndex: 10, 
                  background: 'rgba(22, 27, 34, 0.6)', backdropFilter: 'blur(16px)', 
                  padding: '24px', borderRadius: '16px', border: `1px solid rgba(255,255,255,0.05)`, 
                  borderTop: `4px solid ${selectedNode.color}`, color: '#fff', width: '280px', 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', transition: 'all 0.3s ease' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: selectedNode.color }}>
                      {selectedNode.group === 'incident' ? 'Инцидент' : 
                       selectedNode.group === 'vulnerability' ? 'Уязвимость' : 
                       selectedNode.group === 'source' ? 'Источник' : 'Мера реагирования'}
                    </span>
                    <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '16px' }}>
                      ✕
                    </button>
                  </div>
                  
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600', lineHeight: '1.4' }}>
                    {selectedNode.name.split('\n')[0]}
                  </h4>

                  {selectedNode.name.includes('\n') && (
                    <p style={{ margin: 0, color: '#8ab4f8', fontSize: '14px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>
                      {selectedNode.name.split('\n')[1].replace(/[()]/g, '')}
                    </p>
                  )}
                </div>
              )}

              <ForceGraph2D
                graphData={graphData}
                width={800}
                height={500}
                backgroundColor="rgba(0,0,0,0)" 
                nodeRelSize={8}
                
                linkDirectionalParticles={4}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.008}
                linkDirectionalParticleColor={() => 'rgba(74, 222, 128, 0.8)'}
                linkColor={() => 'rgba(255, 255, 255, 0.05)'}
                
                onNodeClick={(node) => setSelectedNode(node)}
                onNodeDragEnd={node => {
                  node.fx = node.x;
                  node.fy = node.y; 
                }}
                
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name.split('\n')[0];
                  const size = node.val / 2.5;
                  
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, size * 2.2, 0, 2 * Math.PI, false);
                  ctx.fillStyle = `${node.color}15`; 
                  ctx.fill();

                  ctx.beginPath();
                  ctx.arc(node.x, node.y, size * 1.4, 0, 2 * Math.PI, false);
                  ctx.fillStyle = `${node.color}30`; 
                  ctx.fill();

                  ctx.beginPath();
                  ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                  ctx.fillStyle = node.color;
                  ctx.fill();

                  const fontSize = 12 / globalScale;
                  ctx.font = `600 ${fontSize}px "Segoe UI", sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  
                  const textWidth = ctx.measureText(label).width;
                  const bgHeight = fontSize + 8 / globalScale;
                  ctx.fillStyle = 'rgba(13, 17, 23, 0.9)';
                  ctx.fillRect(node.x - textWidth/2 - 6/globalScale, node.y + size + 6/globalScale, textWidth + 12/globalScale, bgHeight);
                  
                  ctx.lineWidth = 0.5 / globalScale;
                  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                  ctx.strokeRect(node.x - textWidth/2 - 6/globalScale, node.y + size + 6/globalScale, textWidth + 12/globalScale, bgHeight);
                  
                  ctx.fillStyle = '#e6edf3';
                  ctx.fillText(label, node.x, node.y + size + bgHeight/2 + 6/globalScale);
                }}
              />
            </div>
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