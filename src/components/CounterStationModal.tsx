import React, { useState } from 'react';
import { X, Bell, Clock, UtensilsCrossed } from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { RECIPES } from '../data/recipes';
import { audioManager } from '../engine/AudioManager';

export const CounterStationModal: React.FC = () => {
  const [, setTick] = useState(0);

  const customers = gameStore.customers;
  const waitingCustomers = customers.filter(
    c => c.state === 'ordering' || c.state === 'waiting' || c.state === 'queuing'
  );
  const dishesOnCounter = gameStore.dishesOnCounter;

  const handleRingBell = () => {
    audioManager.init();
    audioManager.playOvenDing();
    gameStore.nextCustomerSpawnTime = 0.5; // attracts customer immediately!
    gameStore.showToast('Bell Rung! 🛎️', 'A hungry customer was attracted by the welcoming service chime!', 'info');
    setTick(t => t + 1);
  };

  const handleServe = (customerId: string, dishId: string) => {
    audioManager.init();
    gameStore.serveDishToCustomer(customerId, dishId);
    setTick(t => t + 1);
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 660 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <UtensilsCrossed size={26} color="#d4af37" />
            <span>Serving Counter & Guest Service</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="glass-button"
              onClick={handleRingBell}
              style={{ padding: '6px 12px', fontSize: '0.82rem', background: 'rgba(212, 175, 55, 0.2)', border: '1px solid #d4af37' }}
              title="Ring service bell to attract customers faster"
            >
              <Bell size={15} color="#d4af37" />
              <span>Ring Bell</span>
            </button>
            <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Ready Dishes on Counter */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>
              Fresh Dishes Ready on Counter ({dishesOnCounter.length})
            </div>
            {dishesOnCounter.length === 0 && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Bake pizzas in the oven to stock your counter
              </span>
            )}
          </div>

          {dishesOnCounter.length > 0 ? (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {dishesOnCounter.map(dish => {
                const rec = RECIPES.find(r => r.id === dish.recipeId);
                const qualityLabel = dish.quality === 'perfect' 
                  ? '⭐⭐⭐ Perfect (+50%)' 
                  : dish.quality === 'good' 
                  ? '⭐⭐ Good' 
                  : dish.quality === 'burnt' 
                  ? 'Charred' 
                  : 'Undercooked';

                return (
                  <div
                    key={dish.id}
                    style={{
                      minWidth: 160,
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: dish.quality === 'perfect' ? '1.5px solid #4ade80' : '1px solid rgba(255,255,255,0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '1.4rem' }}>{rec?.icon || '🍕'}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                        {rec?.name || dish.recipeId}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: dish.quality === 'perfect' ? '#4ade80' : '#facc15'
                    }}>
                      {qualityLabel}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#e9c46a', fontWeight: 600 }}>
                      🪙 {((rec?.basePrice || 15) * dish.qualityMultiplier).toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '14px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.2)',
              textAlign: 'center',
              fontSize: '0.82rem',
              color: '#94a3b8'
            }}>
              No pizzas waiting on the counter. Head to the Oven or Prep station!
            </div>
          )}
        </div>

        {/* Customer Orders Queue */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0', marginBottom: 10 }}>
            Waiting Diners & Orders ({waitingCustomers.length})
          </div>

          {waitingCustomers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
              {waitingCustomers.map(cust => {
                const order = cust.order;
                const rec = order ? RECIPES.find(r => r.id === order.recipeId) : null;
                const patienceRatio = cust.patience / cust.maxPatience;
                const patiencePercent = Math.max(0, Math.round(patienceRatio * 100));

                let barColor = '#4ade80';
                if (patienceRatio < 0.3) barColor = '#ef4444';
                else if (patienceRatio < 0.6) barColor = '#facc15';

                // Find matching dish on counter if any
                const matchingDish = dishesOnCounter.find(d => d.recipeId === order?.recipeId);

                return (
                  <div
                    key={cust.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      gap: 14
                    }}
                  >
                    {/* Customer Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: cust.appearance.shirtColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}>
                        👤
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>
                          {cust.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#cbd5e1' }}>
                          <span>Wants:</span>
                          <span style={{ fontWeight: 700, color: '#ffd166' }}>
                            {rec?.name || 'Pizza'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Patience Bar */}
                    <div style={{ width: 110 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginBottom: 3 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} /> Patience
                        </span>
                        <span>{patiencePercent}%</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${patiencePercent}%`,
                          height: '100%',
                          background: barColor,
                          transition: 'width 0.2s linear'
                        }} />
                      </div>
                    </div>

                    {/* Serve Action */}
                    <div>
                      {matchingDish ? (
                        <button
                          className="glass-panel btn-success"
                          onClick={() => handleServe(cust.id, matchingDish.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 10,
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Serve Now 🍽️
                        </button>
                      ) : (
                        <button
                          className="glass-panel glass-button"
                          onClick={() => {
                            gameStore.closeModal();
                            gameStore.openModal('prep');
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            fontSize: '0.78rem',
                            opacity: 0.8
                          }}
                        >
                          Prep Dish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '24px',
              borderRadius: 14,
              background: 'rgba(0,0,0,0.2)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10
            }}>
              <div style={{ fontSize: '2rem' }}>🪑</div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#e2e8f0' }}>
                All tables and queue are currently clear!
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Ring the service bell above or wait for walking villagers to smell the delicious wood-fired aroma!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
