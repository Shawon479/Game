import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { gameStore } from '../engine/GameStore';
import { RECIPES } from '../data/recipes';
import type { SpecialEvent } from '../types/game';

export const SpecialEventBanner: React.FC = () => {
  const [events, setEvents] = useState<SpecialEvent[]>(gameStore.getActiveEvents());
  const [specialId, setSpecialId] = useState<string | null>(gameStore.dailySpecialRecipeId);
  const [modalOpen, setModalOpen] = useState(gameStore.activeModal !== null);

  useEffect(() => {
    const unsub = gameStore.subscribe(() => {
      setEvents([...gameStore.getActiveEvents()]);
      setSpecialId(gameStore.dailySpecialRecipeId);
      setModalOpen(gameStore.activeModal !== null);
    });
    return unsub;
  }, []);

  const special = RECIPES.find(r => r.id === specialId) ?? null;
  if (modalOpen || (events.length === 0 && !special)) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      zIndex: 18,
      alignItems: 'center',
      pointerEvents: 'none'
    }}>
      {special && (
        <button
          className="daily-special-banner"
          onClick={() => gameStore.openModal('recipes')}
          title="Open the cookbook to choose today's special"
          style={{ pointerEvents: 'auto' }}
        >
          <span className="daily-special-icon">
            <Star size={14} fill="#ffd166" color="#ffd166" />
          </span>
          <span className="daily-special-kicker">Chef&apos;s Special</span>
          <strong className="daily-special-name">{special.icon} {special.name}</strong>
          <span className="daily-special-bonus">+30% price · 3× orders</span>
        </button>
      )}

      {events.map(event => {
        const pct = event.remainingSeconds / event.durationSeconds;
        const colorMap: Record<string, string> = {
          pizza_festival: 'linear-gradient(135deg, #d62828cc, #f77f00cc)',
          vip_visit: 'linear-gradient(135deg, #7b2d8bcc, #c77dffcc)',
          health_inspector: 'linear-gradient(135deg, #264653cc, #2a9d8fcc)',
          harvest_festival: 'linear-gradient(135deg, #386641cc, #6a994ecc)',
          rainy_day_special: 'linear-gradient(135deg, #1d3557cc, #457b9dcc)',
        };
        const bg = colorMap[event.type] || 'linear-gradient(135deg, #1a1a2ecc, #16213ecc)';
        const secs = Math.ceil(event.remainingSeconds);
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        const timeStr = mins > 0 ? `${mins}:${s.toString().padStart(2, '0')}` : `${s}s`;

        return (
          <div key={event.id} style={{
            background: bg,
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            minWidth: '260px',
            animation: 'slideInDown 0.4s ease-out'
          }}>
            <span style={{ fontSize: '20px' }}>{event.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                letterSpacing: '0.3px'
              }}>{event.title}</div>
              <div style={{
                height: '3px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                marginTop: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct * 100}%`,
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '2px',
                  transition: 'width 1s linear'
                }} />
              </div>
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'monospace',
              minWidth: '36px',
              textAlign: 'right'
            }}>{timeStr}</div>
          </div>
        );
      })}
    </div>
  );
};
