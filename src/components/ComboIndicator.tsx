import React, { useEffect, useState, useRef } from 'react';
import { gameStore } from '../engine/GameStore';

export const ComboIndicator: React.FC = () => {
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(false);
  const prevCombo = useRef(0);

  useEffect(() => {
    const unsub = gameStore.subscribe(() => {
      const newCombo = gameStore.serveCombo;
      if (newCombo !== prevCombo.current && newCombo >= 2) {
        setFlash(true);
        setTimeout(() => setFlash(false), 400);
      }
      prevCombo.current = newCombo;
      setCombo(newCombo);
    });
    return unsub;
  }, []);

  if (combo < 2) return null;

  const isHot = combo >= 5;
  const isMega = combo >= 8;

  const bonusPct = Math.round((Math.min(1.0 + (combo - 2) * 0.12, 1.6) - 1) * 100);

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '20px',
      zIndex: 700,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      animation: flash ? 'comboPop 0.4s ease-out' : 'none',
      filter: isMega ? 'drop-shadow(0 0 12px #ff6b35)' : isHot ? 'drop-shadow(0 0 8px #ffc857)' : 'none',
    }}>
      <style>{`
        @keyframes comboPop {
          0% { transform: scale(1.4); }
          100% { transform: scale(1.0); }
        }
        @keyframes comboGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(255,107,53,0.6); }
          50% { box-shadow: 0 0 24px rgba(255,107,53,0.9); }
        }
      `}</style>
      <div style={{
        background: isMega
          ? 'linear-gradient(135deg, #d62828, #f77f00)'
          : isHot
          ? 'linear-gradient(135deg, #e63946, #d62828)'
          : 'linear-gradient(135deg, #2a9d8f, #264653)',
        borderRadius: '16px',
        padding: '8px 16px',
        textAlign: 'center',
        border: '2px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(8px)',
        animation: isMega ? 'comboGlow 0.8s infinite' : 'none',
      }}>
        <div style={{
          fontSize: isMega ? '28px' : isHot ? '24px' : '20px',
          fontWeight: 900,
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '-0.5px',
          lineHeight: 1,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          {isMega ? '🔥🔥' : isHot ? '🔥' : '⚡'} {combo}x
        </div>
        <div style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          marginTop: '2px',
        }}>
          COMBO +{bonusPct}%
        </div>
      </div>
    </div>
  );
};
