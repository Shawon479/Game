import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, Check, Coins, MapPin, Move, RotateCw, Sparkles, X
} from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { BUILDINGS } from '../data/buildings';

export const BuildPlacementHUD: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return gameStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const placement = gameStore.placement;
  if (!placement) return null;

  const def = BUILDINGS.find(b => b.typeId === placement.typeId);
  if (!def) return null;

  const moving = placement.mode === 'move';
  const valid = placement.valid;

  return (
    <div className="build-placement-hud" style={{
      position: 'fixed',
      left: '50%',
      bottom: 92,
      transform: 'translateX(-50%)',
      zIndex: 32,
      width: 'min(540px, calc(100vw - 28px))',
      pointerEvents: 'auto',
      animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div className="glass-panel" style={{
        padding: '12px 14px',
        borderRadius: 18,
        border: valid ? '1px solid rgba(96, 220, 148, 0.35)' : '1px solid rgba(248, 113, 113, 0.4)',
        background: valid
          ? 'linear-gradient(145deg, rgba(24, 38, 31, 0.96), rgba(17, 26, 22, 0.96))'
          : 'linear-gradient(145deg, rgba(44, 27, 27, 0.97), rgba(28, 20, 20, 0.97))',
        boxShadow: '0 18px 48px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0,
            background: valid ? 'rgba(74, 222, 128, 0.12)' : 'rgba(248, 113, 113, 0.12)',
            border: valid ? '1px solid rgba(74, 222, 128, 0.22)' : '1px solid rgba(248, 113, 113, 0.24)'
          }}>
            {def.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                letterSpacing: 0.65,
                textTransform: 'uppercase',
                color: moving ? '#93c5fd' : '#ffd166',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3
              }}>
                {moving ? <Move size={10} /> : <Sparkles size={10} />}
                {moving ? 'Relocating' : 'Placing'}
              </span>
              <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {def.name}
              </span>
            </div>
            <div style={{
              marginTop: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.7rem',
              color: valid ? '#9ff0bc' : '#fca5a5',
              lineHeight: 1.3
            }}>
              {valid ? <Check size={12} /> : <AlertTriangle size={12} />}
              <span>{valid ? (moving ? 'Clear site — click to move' : 'Clear site — click to build') : placement.reason}</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
            flexShrink: 0
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 800,
              fontSize: '0.8rem',
              color: moving ? '#93c5fd' : '#e9c46a'
            }}>
              {moving ? <Move size={12} /> : <Coins size={12} />}
              {moving ? 'Free' : def.cost}
            </span>
            <span style={{ fontSize: '0.62rem', color: '#7f8c99' }}>
              {def.footprint.width}×{def.footprint.depth} footprint
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 10,
          paddingTop: 9,
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#83919e',
            fontSize: '0.66rem',
            flexWrap: 'wrap'
          }}>
            <span><kbd>Click</kbd> / <kbd>Enter</kbd> place</span>
            <span><kbd>R</kbd> rotate</span>
            <span><kbd>Esc</kbd> cancel</span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              className="glass-button"
              onClick={() => gameStore.rotatePlacement()}
              title="Rotate 90 degrees [R]"
              style={{ padding: '7px 10px', fontSize: '0.74rem' }}
            >
              <RotateCw size={13} />
              <span className="build-hud-btn-label">Rotate</span>
            </button>
            <button
              className="glass-button"
              onClick={() => gameStore.cancelPlacement()}
              title="Cancel placement [Esc]"
              style={{ padding: '7px 10px', fontSize: '0.74rem' }}
            >
              <X size={13} />
              <span className="build-hud-btn-label">Cancel</span>
            </button>
            <button
              className={`glass-panel ${valid ? 'btn-success' : 'glass-button'}`}
              onClick={() => gameStore.confirmPlacement()}
              disabled={!valid}
              title={valid ? 'Confirm placement [Enter]' : placement.reason}
              style={{
                padding: '7px 12px',
                fontSize: '0.76rem',
                fontWeight: 800,
                borderRadius: 10,
                opacity: valid ? 1 : 0.5,
                cursor: valid ? 'pointer' : 'not-allowed',
                gap: 5
              }}
            >
              {moving ? <MapPin size={13} /> : <Check size={13} />}
              {moving ? 'Move here' : 'Build'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
