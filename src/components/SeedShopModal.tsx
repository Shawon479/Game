import React, { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { INGREDIENT_ITEMS } from '../data/recipes';
import { CROPS } from '../data/crops';
import { audioManager } from '../engine/AudioManager';

export const SeedShopModal: React.FC = () => {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState<'pantry' | 'seeds'>('pantry');

  const handleBuy = (itemId: string, qty: number, price: number) => {
    audioManager.init();
    if (gameStore.buyItem(itemId, qty, price)) {
      setTick(t => t + 1);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <ShoppingBag size={26} color="#2a9d8f" />
            <span>Piazza Market & Seed Merchant</span>
          </div>
          <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="glass-button"
            onClick={() => setTab('pantry')}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '0.88rem',
              background: tab === 'pantry' ? '#d97746' : 'rgba(255,255,255,0.06)',
              border: tab === 'pantry' ? '1px solid #d97746' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            🥖 Kitchen Pantry Restock
          </button>

          <button
            className="glass-button"
            onClick={() => setTab('seeds')}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '0.88rem',
              background: tab === 'seeds' ? '#2a9d8f' : 'rgba(255,255,255,0.06)',
              border: tab === 'seeds' ? '1px solid #2a9d8f' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            🌱 Farm Crop Seeds
          </button>
        </div>

        {/* Items List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxHeight: 380, overflowY: 'auto' }}>
          {tab === 'pantry' ? (
            Object.entries(INGREDIENT_ITEMS)
              .filter(([, item]) => item.category === 'pantry')
              .map(([key, item]) => {
                const currentQty = gameStore.inventory[key] || 0;
                return (
                  <div
                    key={key}
                    style={{
                      padding: '14px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#e9c46a' }}>
                          🪙 {item.buyPrice} ea
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginTop: 4 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        In Pantry: <b style={{ color: '#fff' }}>{currentQty}</b>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="glass-panel btn-primary"
                        onClick={() => handleBuy(key, 1, item.buyPrice)}
                        style={{ flex: 1, padding: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        +1
                      </button>
                      <button
                        className="glass-panel glass-button"
                        onClick={() => handleBuy(key, 5, item.buyPrice)}
                        style={{ flex: 1, padding: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        +5 (🪙{item.buyPrice * 5})
                      </button>
                    </div>
                  </div>
                );
              })
          ) : (
            Object.values(CROPS).map(crop => {
              const seedKey = `seed_${crop.id}`;
              const currentSeeds = gameStore.inventory[seedKey] || 0;

              return (
                <div
                  key={crop.id}
                  style={{
                    padding: '14px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 8
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.6rem' }}>{crop.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#e9c46a' }}>
                        🪙 {crop.seedCost}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginTop: 4 }}>
                      {crop.name} Seeds
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Seeds in Sack: <b style={{ color: '#fff' }}>{currentSeeds}</b>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#2a9d8f', marginTop: 2 }}>
                      Harvest Yield: {crop.yieldMin}-{crop.yieldMax} crops
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="glass-panel btn-success"
                      onClick={() => handleBuy(seedKey, 1, crop.seedCost)}
                      style={{ flex: 1, padding: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      +1 Seed
                    </button>
                    <button
                      className="glass-panel glass-button"
                      onClick={() => handleBuy(seedKey, 4, crop.seedCost)}
                      style={{ flex: 1, padding: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      +4 (🪙{crop.seedCost * 4})
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
