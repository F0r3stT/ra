import React, { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import axios from 'axios';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function ThreatMap() {
  const [markers, setMarkers] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Определяем, смотрит ли пользователь с телефона
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Слушаем изменение размера окна для адаптивности
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Загружаем точки при монтировании компонента (Синхронизация в реальном времени)
  useEffect(() => {
    axios.get('/api/analytics/geomap', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setMarkers(res.data))
    .catch(err => console.error('Ошибка загрузки карты', err));
  }, []);

  // Красивый перевод кода страны в название
  const getCountryName = (isoCode) => {
    if (!isoCode) return 'Неизвестная локация';
    try {
      return new Intl.DisplayNames(['ru'], {type: 'region'}).of(isoCode);
    } catch(e) {
      return isoCode;
    }
  }

  const countryAttacks = selectedCountry 
    ? markers.filter(m => m.country === selectedCountry)
    : [];

  return (
    <div className="desc-block" style={{ position: 'relative' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e6edf3' }}>
        Глобальный мониторинг угроз 
      </h3>
      <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '15px' }}>
        {isMobile ? 'Сдвигайте карту пальцем. Нажмите на точку атаки для деталей.' : 'Масштабируйте карту колесиком мыши. Нажмите на красную точку атаки для деталей.'}
      </p>
      
      {/* АДАПТИВНЫЙ КОНТЕЙНЕР */}
      <div style={{ 
        height: isMobile ? 'auto' : '550px', // На телефоне высота подстраивается, на ПК - 550px
        width: '100%', background: 'radial-gradient(circle at center, #0d1117 0%, #010409 100%)', 
        borderRadius: '12px', overflow: 'hidden', border: '1px solid #1f2937', 
        display: 'flex', flexDirection: isMobile ? 'column' : 'row' // На телефоне колонка, на ПК в ряд
      }}>
        
        {/* КАРТА */}
        <div style={{ flex: 1, minHeight: isMobile ? '350px' : '100%', position: 'relative' }}>
          {/* Масштаб 145 идеально вписывает карту мира без обрезки краев */}
          <ComposableMap projectionConfig={{ scale: 145 }} style={{ width: '100%', height: '100%' }}>
            <ZoomableGroup center={[0, 15]} zoom={1} minZoom={1} maxZoom={10}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#161b22"
                      stroke="#30363d"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#21262d", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {markers.map((marker, i) => (
                <Marker 
                  key={i} 
                  coordinates={marker.coordinates}
                  onClick={() => setSelectedCountry(marker.country)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="6" fill="#f85149" opacity="0.3">
                    <animate attributeName="r" from="4" to="18" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle r="3" fill="#f85149" />
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* БОКОВАЯ/НИЖНЯЯ ПАНЕЛЬ С ИНФОРМАЦИЕЙ */}
        <div style={{ 
          width: isMobile ? '100%' : '350px', 
          height: isMobile ? '300px' : '100%',
          background: 'rgba(13, 17, 23, 0.85)', backdropFilter: 'blur(10px)',
          borderLeft: isMobile ? 'none' : '1px solid #1f2937', 
          borderTop: isMobile ? '1px solid #1f2937' : 'none',
          padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column'
        }}>
          {selectedCountry ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '22px' }}>{getCountryName(selectedCountry)}</h4>
                  <span style={{ fontSize: '12px', color: '#8b949e' }}>ISO Код: {selectedCountry}</span>
                </div>
                <button onClick={() => setSelectedCountry(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', padding: '5px 10px' }}>✕</button>
              </div>

              <div style={{ color: '#f85149', fontWeight: 'bold', marginBottom: '15px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                Зафиксировано инцидентов: {countryAttacks.length}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {countryAttacks.map((attack, idx) => {
                  // УМНАЯ ЛОГИКА ОТОБРАЖЕНИЯ (Стокгольм, Швеция)
                  const locationText = attack.city && attack.city !== 'Неизвестный город' 
                    ? `${attack.city}, ${getCountryName(selectedCountry)}` 
                    : getCountryName(selectedCountry);

                  return (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ color: '#e6edf3', fontWeight: '500', fontSize: '15px', marginBottom: '6px' }}>{attack.incident}</div>
                      
                      <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4f8" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span style={{ color: '#e6edf3' }}>{locationText}</span>
                      </div>

                      <div style={{ fontFamily: 'monospace', color: '#8ab4f8', fontSize: '13px', marginBottom: '6px', background: '#0d1117', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                        IP: {attack.ip}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                        <span style={{ color: '#8b949e' }}>{attack.name}</span>
                        <span style={{ color: attack.threat >= 4 ? '#f85149' : '#d29922', fontWeight: 'bold' }}>Угроза: {attack.threat}/5</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto 0', color: '#8b949e' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '15px', opacity: 0.5, display: 'inline-block' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <p style={{ fontSize: '15px', lineHeight: '1.6' }}>
                Радар активен.<br/><br/>
                Нажмите на красную точку атаки, чтобы загрузить данные о локации и IP-адресе.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ThreatMap;