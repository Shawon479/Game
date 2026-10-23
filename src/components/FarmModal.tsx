import React, { useState } from 'react';
import { X, Sprout, Droplets, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { CROPS } from '../data/crops';
import { audioManager } from '../engine/AudioManager';

export const FarmModal: React.FC = () => {
  const [, setTick] = useState(0);

  const plots = gameStore.farmPlots;
  const currentPlotId = gameStore.selectedPlotId !== null ? gameStore.selectedPlotId : (plots[0]?.plotId ?? 0);
  const plot = plots.find(p => p.plotId === currentPlotId) || plots[0];

  const crop = plot?.cropId ? CROPS[plot.cropId] : null;

  const handleNextPlot = () => {
    const currentIndex = plots.findIndex(p => p.plotId === currentPlotId);
    const nextIndex = (currentIndex + 1) % plots.length;
    gameStore.selectedPlotId = plots[nextIndex].plotId;
    setTick(t => t + 1);
  };

  const handlePrevPlot = () => {
    const currentIndex = plots.findIndex(p => p.plotId === currentPlotId);
    const prevIndex = (currentIndex - 1 + plots.length) % plots.length;
    gameStore.selectedPlotId = plots[prevIndex].plotId;
    setTick(t => t + 1);
  };

  const handleTill = () => {
    audioManager.init();
    if (plot) {
      gameStore.tillPlot(plot.plotId);
      setTick(t => t + 1);
    }
  };

  const handlePlant = (cropId: string) => {
    audioManager.init();
    if (plot) {
      gameStore.plantCrop(plot.plotId, cropId);
      setTick(t => t + 1);
    }
  };

  const handleWater = () => {
    audioManager.init();
    if (plot) {
      gameStore.waterPlot(plot.plotId);
      setTick(t => t + 1);
    }
  };

  const handleHarvest = () => {
    audioManager.init();
    if (plot) {
      gameStore.harvestPlot(plot.plotId);
      setTick(t => t + 1);
    }
  };

  if (!plot) return null;

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header with Plot Selector */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sprout size={26} color="#2a9d8f" />
            <div className="modal-title">
              <span>Farm Plot #{plot.plotId + 1}</span>
            </div>
            {/* Plot Paging Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
              <button className="glass-button" onClick={handlePrevPlot} style={{ width: 28, height: 28, padding: 0 }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                {plots.findIndex(p => p.plotId === currentPlotId) + 1} / {plots.length}
              </span>
              <button className="glass-button" onClick={handleNextPlot} style={{ width: 28, height: 28, padding: 0 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
            <X size={20} />
          </button>
        </div>

        {/* Plot Status Details */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14
        }}>
          {/* Visual Plot Badge */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: plot.state === 'empty' 
              ? 'rgba(90, 62, 43, 0.4)' 
              : plot.state === 'tilled' 
              ? 'rgba(61, 39, 29, 0.6)' 
              : 'rgba(42, 157, 143, 0.25)',
            border: '2px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem'
          }}>
            {plot.state === 'empty' ? '🪵' : plot.state === 'tilled' ? '🟫' : crop?.icon || '🌱'}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', textTransform: 'capitalize' }}>
              {plot.state === 'growing' && crop ? crop.name : `Plot State: ${plot.state}`}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
              {plot.state === 'empty' && 'Untilled dry soil. Requires tilling before planting seeds.'}
              {plot.state === 'tilled' && 'Furrowed, aerated garden soil ready for seed sowing.'}
              {plot.state === 'growing' && `${Math.round(plot.growthProgress * 100)}% Grown • ${plot.isWatered ? 'Moist & Hydrated (+40% speed)' : 'Needs water!'}`}
              {plot.state === 'ready' && 'Ripe and ready for harvest! Click to gather produce.'}
            </div>
          </div>

          {/* Growth Progress Bar */}
          {plot.state === 'growing' && (
            <div style={{ width: '100%', maxWidth: 360 }}>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round(plot.growthProgress * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2a9d8f, #4ade80)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Actions Based on Plot State */}
        <div>
          {plot.state === 'empty' && (
            <button
              className="glass-panel btn-primary"
              onClick={handleTill}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <span>Till Soil with Spade</span>
            </button>
          )}

          {plot.state === 'tilled' && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>
                Select Seeds to Sow:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {Object.values(CROPS).map(cr => {
                  const seedKey = `seed_${cr.id}`;
                  const seedCount = gameStore.inventory[seedKey] || 0;
                  const hasSeeds = seedCount > 0;

                  return (
                    <button
                      key={cr.id}
                      className="glass-button"
                      onClick={() => hasSeeds && handlePlant(cr.id)}
                      disabled={!hasSeeds}
                      style={{
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: hasSeeds ? 1 : 0.45,
                        cursor: hasSeeds ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.4rem' }}>{cr.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{cr.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>~{cr.baseGrowthSeconds}s growth</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#e9c46a' }}>
                        x{seedCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {plot.state === 'growing' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="glass-panel btn-success"
                onClick={handleWater}
                disabled={plot.isWatered}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 12,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  opacity: plot.isWatered ? 0.6 : 1,
                  cursor: plot.isWatered ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Droplets size={18} />
                <span>{plot.isWatered ? 'Plot Hydrated ✓' : 'Water Plot (+40% Boost)'}</span>
              </button>
            </div>
          )}

          {plot.state === 'ready' && (
            <button
              className="glass-panel btn-success"
              onClick={handleHarvest}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 14,
                fontSize: '1.1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 0 20px rgba(42, 157, 143, 0.6)'
              }}
            >
              <Sparkles size={22} color="#ffd166" />
              <span>Harvest Fresh {crop?.name || 'Produce'} 🧺</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
