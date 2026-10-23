import React, { useState, useEffect } from 'react';
import { X, Flame, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { RECIPES } from '../data/recipes';
import { audioManager } from '../engine/AudioManager';

export const OvenStationModal: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    // 30 FPS update for silky smooth needle animation
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 33);
    return () => clearInterval(interval);
  }, []);

  const ovenData = gameStore.ovenPizza;
  const recipe = ovenData ? RECIPES.find(r => r.id === ovenData.recipeId) : null;

  // Calculate bake progress (0 to 2.0 scale where 1.0 is exact ideal time)
  const elapsed = ovenData ? ovenData.elapsedSeconds : 0;
  const ideal = ovenData ? ovenData.idealSeconds : 10;
  const progressRatio = elapsed / ideal; // 1.0 = ideal bake
  const gaugePercent = Math.min(100, Math.max(0, (progressRatio / 1.6) * 100));

  let zoneText = 'Heating Up & Melting Cheese...';
  let zoneColor = '#94a3b8';
  let zoneIcon = <Flame size={18} color="#f97316" />;

  if (progressRatio < 0.7) {
    zoneText = 'Undercooked (Doughy)';
    zoneColor = '#60a5fa';
  } else if (progressRatio >= 0.7 && progressRatio < 0.88) {
    zoneText = 'Good Bake (Almost Golden)';
    zoneColor = '#facc15';
  } else if (progressRatio >= 0.88 && progressRatio <= 1.12) {
    zoneText = 'PERFECT GOLDEN CRUST! (Pull Now!) ⭐⭐⭐';
    zoneColor = '#4ade80';
    zoneIcon = <Sparkles size={20} color="#4ade80" />;
  } else if (progressRatio > 1.12 && progressRatio <= 1.35) {
    zoneText = 'Well Done (Dark Crust)';
    zoneColor = '#fb923c';
  } else {
    zoneText = 'Burnt & Charred! 🔥';
    zoneColor = '#ef4444';
    zoneIcon = <AlertTriangle size={18} color="#ef4444" />;
  }

  const handlePullFromOven = () => {
    audioManager.init();
    const dish = gameStore.pullPizzaFromOven();
    if (dish) {
      gameStore.closeModal();
      gameStore.openModal('counter');
    }
  };

  const handleQuickLoadMargherita = () => {
    audioManager.init();
    if (gameStore.canCraftRecipe('margherita_pizza')) {
      gameStore.prepPizza('margherita_pizza');
    } else {
      gameStore.showToast('Missing Ingredients', 'Buy ingredients from the Market Shop first!', 'warning');
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Flame size={26} color="#e63946" />
            <span>Wood-Fired Pizza Oven</span>
          </div>
          <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
            <X size={20} />
          </button>
        </div>

        {ovenData && recipe ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Pizza Info Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.3)',
              padding: '12px 18px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '2rem' }}>{recipe.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{recipe.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Ideal Bake: {ideal} seconds in hot stone</div>
                </div>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e9c46a' }}>
                {elapsed.toFixed(1)}s / {ideal}s
              </div>
            </div>

            {/* Visual Wood-Fired Oven Graphic with Embers */}
            <div style={{
              background: 'radial-gradient(circle, #3d1308 0%, #1a0a05 80%)',
              border: '2px solid #b9382b',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 30px rgba(255, 69, 0, 0.4)'
            }}>
              {/* Animated embers glow */}
              <div style={{
                fontSize: '3.5rem',
                filter: 'drop-shadow(0 0 16px rgba(255, 165, 0, 0.8))',
                animation: 'pulseGlow 1.5s infinite ease-in-out'
              }}>
                🍕
              </div>

              <div style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 700,
                fontSize: '0.95rem',
                color: zoneColor,
                textShadow: '0 2px 8px rgba(0,0,0,0.8)'
              }}>
                {zoneIcon}
                <span>{zoneText}</span>
              </div>
            </div>

            {/* Timing Gauge Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>Undercooked</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>★ Golden Window (Sweet Spot) ★</span>
                <span>Burnt</span>
              </div>

              {/* Progress bar with sweet spot highlight */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: 24,
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                {/* Golden window colored background segment (approx 55% to 70% of bar) */}
                <div style={{
                  position: 'absolute',
                  left: '52%',
                  width: '18%',
                  top: 0,
                  bottom: 0,
                  background: 'rgba(74, 222, 128, 0.35)',
                  borderLeft: '2px dashed #4ade80',
                  borderRight: '2px dashed #4ade80'
                }} />

                {/* Animated needle gauge */}
                <div style={{
                  position: 'absolute',
                  left: `${gaugePercent}%`,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: '#fff',
                  boxShadow: '0 0 10px #fff, 0 0 20px #e9c46a',
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                  transition: 'left 0.05s linear'
                }} />

                {/* Fill bar */}
                <div style={{
                  width: `${gaugePercent}%`,
                  height: '100%',
                  background: progressRatio <= 1.15 
                    ? 'linear-gradient(90deg, #60a5fa, #facc15, #4ade80)' 
                    : 'linear-gradient(90deg, #4ade80, #f97316, #ef4444)',
                  opacity: 0.65
                }} />
              </div>
            </div>

            {/* Big Action Button */}
            <button
              className="glass-panel btn-primary"
              onClick={handlePullFromOven}
              style={{
                padding: '16px',
                borderRadius: 14,
                fontSize: '1.1rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: 'pointer',
                boxShadow: progressRatio >= 0.88 && progressRatio <= 1.12 
                  ? '0 0 24px rgba(74, 222, 128, 0.7)' 
                  : '0 4px 14px rgba(217, 119, 70, 0.4)'
              }}
            >
              <span>Pull Pizza from Oven</span>
              <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          /* Empty Oven State */
          <div style={{
            textAlign: 'center',
            padding: '30px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{ fontSize: '3rem' }}>🪵</div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>The Oven is Hot & Ready!</h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: 6, maxWidth: 360 }}>
                Prepare an artisan pizza at the Prep Counter first, or quick-load a Margherita if you have ingredients.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="glass-panel btn-primary"
                onClick={() => {
                  gameStore.closeModal();
                  gameStore.openModal('prep');
                }}
                style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer' }}
              >
                Go to Prep Counter
              </button>

              <button
                className="glass-panel glass-button"
                onClick={handleQuickLoadMargherita}
                style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer' }}
              >
                Quick Bake Margherita
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
