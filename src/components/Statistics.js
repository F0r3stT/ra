import React, { useState, useMemo, useRef } from 'react';
import './Statistics.css';


const PERIODS = [
  { label: '7', value: 7 },
  { label: '30', value: 30 },
  { label: '90', value: 90 },
  { label: '180', value: 180 },
  { label: '365', value: 365 },
];

const STATUS_COLORS = {
  Активна: '#ff9800',
  Заблокирована: '#4caf50',
};

const Tooltip = ({ bucket, position, visible }) => {
  if (!visible || !bucket) return null;
  
  const allItems = [
    ...bucket.items.Активна,
    ...bucket.items.Заблокирована,
  ];

  return (
    <div className="stats-tooltip" style={{ left: position.x, top: position.y }}>
      <div className="stats-tooltip-date">{bucket.labelFull}</div>
      {allItems.length === 0 ? (
        <div className="stats-tooltip-empty">Нет атак</div>
      ) : (
        <div className="stats-tooltip-list">
          {allItems.map((item, i) => (
            <div key={i} className="stats-tooltip-item">
              <span className="stats-tooltip-name">{item.name}</span>
              <span className="stats-tooltip-meta">
                {item.protocol} | {item.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Statistics = ({ attacks }) => {
  const todayMemo = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  
  const todayStr = todayMemo.toISOString().slice(0, 10);

  const [activePeriod, setActivePeriod] = useState(30);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, bucket: null, position: { x: 0, y: 0 } });
  const chartRef = useRef(null);

  const { fromDate, toDate } = useMemo(() => {
    if (isCustom && customFrom && customTo) {
      return { fromDate: new Date(customFrom), toDate: new Date(customTo) };
    }
    const from = new Date(todayMemo);
    from.setDate(from.getDate() - activePeriod);
    return { fromDate: from, toDate: todayMemo };
  }, [activePeriod, isCustom, customFrom, customTo, todayMemo]);

  const periodDays = useMemo(() => {
    if (!fromDate || !toDate) return 30;
    return Math.max(1, Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)));
  }, [fromDate, toDate]);

  const { buckets, maxCount } = useMemo(() => {
    if (!fromDate || !toDate || toDate < fromDate) return { buckets: [], maxCount: 1 };

    let raw = periodDays <= 14 ? periodDays
      : periodDays <= 60 ? Math.ceil(periodDays / 2)
      : periodDays <= 180 ? Math.ceil(periodDays / 7)
      : Math.ceil(periodDays / 14);

    const capped = Math.min(raw, 60);
    const bucketSize = Math.ceil(periodDays / capped);

    const buckets = Array.from({ length: capped }, (_, i) => {
      const start = new Date(fromDate);
      start.setDate(fromDate.getDate() + i * bucketSize);
      const end = new Date(start);
      end.setDate(start.getDate() + bucketSize - 1);

      const fmt = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const short = fmt(start);
      const full = bucketSize === 1
        ? start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : `${short}–${fmt(end)}`;

      return {
        start,
        end,
        label: short,
        labelFull: full,
        items: { Активна: [], Заблокирована: [] }
      };
    });

    attacks.forEach(attack => {
      if (!attack.date) return;
      const d = new Date(attack.date);
      d.setHours(0, 0, 0, 0);
      if (d < fromDate || d > toDate) return;

      const idx = Math.min(
        Math.floor((d - fromDate) / (1000 * 60 * 60 * 24 * bucketSize)),
        capped - 1
      );
      if (idx >= 0 && (attack.status === 'Активна' || attack.status === 'Заблокирована')) {
        buckets[idx].items[attack.status].push(attack);
      }
    });

    const maxCount = Math.max(
      1,
      ...buckets.map(b => b.items.Активна.length + b.items.Заблокирована.length)
    );
    return { buckets, maxCount };
  }, [attacks, fromDate, toDate, periodDays]);

  const totalInPeriod = buckets.reduce(
    (s, b) => s + b.items.Активна.length + b.items.Заблокирована.length, 0
  );

  const handlePeriodClick = (val) => {
    setActivePeriod(val);
    setIsCustom(false);
    setCustomFrom('');
    setCustomTo('');
  };

  const handleCustomFromChange = (e) => {
    setCustomFrom(e.target.value);
    setIsCustom(false);
  };

  const handleCustomToChange = (e) => {
    setCustomTo(e.target.value);
    setIsCustom(false);
  };

  const handleCustomBlur = () => {
    if (customFrom && customTo) {
      setIsCustom(true);
    }
  };

  const handleBarEnter = (e, bucket) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const chartRect = chartRef.current?.getBoundingClientRect();
    if (!chartRect) return;
    setTooltip({
      visible: true,
      bucket,
      position: {
        x: rect.left - chartRect.left + rect.width / 2,
        y: rect.top - chartRect.top - 8,
      },
    });
  };

  const handleBarLeave = () => setTooltip({ visible: false, bucket: null, position: { x: 0, y: 0 } });

  const labelStep = buckets.length <= 12 ? 1
    : buckets.length <= 30 ? 3
    : Math.ceil(buckets.length / 10);

  const MAX_H = 140;

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <div>
          <div className="stats-title">Атаки по дням</div>
          <div className="stats-subtitle">
            {totalInPeriod} атак за период
          </div>
        </div>

        <div className="stats-controls">
          <div className="stats-periods-block">
            <div className="stats-periods">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  className={`stats-period-btn ${!isCustom && activePeriod === p.value ? 'active' : ''}`}
                  onClick={() => handlePeriodClick(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="stats-periods-label">дней</div>
          </div>

          <div className="stats-custom">
            <div className="stats-date-field">
              <label className="stats-date-label">От</label>
              <input
                type="date"
                className="stats-date"
                value={customFrom}
                max={customTo || todayStr}
                onChange={handleCustomFromChange}
                onBlur={handleCustomBlur}
              />
            </div>
            <span className="stats-dash">–</span>
            <div className="stats-date-field">
              <label className="stats-date-label">До</label>
              <input
                type="date"
                className="stats-date"
                value={customTo}
                min={customFrom}
                max={todayStr}
                onChange={handleCustomToChange}
                onBlur={handleCustomBlur}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="stats-legend">
        <div className="stats-legend-item">
          <span className="stats-legend-dot" style={{ background: STATUS_COLORS.Активна }}></span>
          <span>Активна</span>
        </div>
        <div className="stats-legend-item">
          <span className="stats-legend-dot" style={{ background: STATUS_COLORS.Заблокирована }}></span>
          <span>Заблокирована</span>
        </div>
      </div>

      <div className="stats-chart-wrapper" ref={chartRef}>
        <Tooltip bucket={tooltip.bucket} position={tooltip.position} visible={tooltip.visible} />

        <div className="stats-chart">
          {buckets.map((bucket, i) => {
            const total = bucket.items.Активна.length + bucket.items.Заблокирована.length;
            const barH = total === 0 ? 4 : Math.max(6, Math.round((total / maxCount) * MAX_H));

            return (
              <div key={i} className="stats-col">
                <div className="stats-bar-wrapper" style={{ height: MAX_H }}>
                  {total === 0 ? (
                    <div className="stats-bar-empty"></div>
                  ) : (
                    <div
                      className="stats-bar-stack"
                      style={{ height: barH }}
                      onMouseEnter={e => handleBarEnter(e, bucket)}
                      onMouseLeave={handleBarLeave}
                    >
                      {['Заблокирована', 'Активна'].map(st => (
                        bucket.items[st].length > 0 && (
                          <div
                            key={st}
                            className="stats-bar-segment"
                            style={{
                              height: `${(bucket.items[st].length / total) * 100}%`,
                              background: STATUS_COLORS[st],
                            }}
                          />
                        )
                      ))}
                      <div className="stats-bar-count">{total}</div>
                    </div>
                  )}
                </div>
                {i % labelStep === 0 && (
                  <div className="stats-bar-label">{bucket.label}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Statistics;