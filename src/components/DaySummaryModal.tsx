import React, { useState, useEffect } from 'react';
import { 
  Coins, TrendingUp, TrendingDown, Star, 
  Utensils, Sprout, Award, ArrowRight 
} from 'lucide-react';
import { gameStore } from '../engine/GameStore';
import { audioManager } from '../engine/AudioManager';

export const DaySummaryModal: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return gameStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const summary = gameStore.daySummary || {
    day: gameStore.day,
    dishesServed: 0,
    cropsHarvested: 0,
    coinsEarned: 0,
    coinsSpent: 0,
    perfectBakes: 0,
    burntDishes: 0,
    customersLost: 0,
    bestDish: 'Margherita Pizza',
    weatherToday: gameStore.weather,
    reputationChange: 0.1,
    challengesCompleted: 0
  };

  const netProfit = summary.coinsEarned - summary.coinsSpent;

  const handleContinue = () => {
    audioManager.playLevelUp();
    gameStore.dismissDaySummary();
  };

  return (
    <div className="modal-backdrop" onClick={handleContinue}>
      <div 
        className="modal-panel glass-panel" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 620, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', textAlign: 'center' }}
      >
        {/* Banner with Day Recap */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(233, 196, 106, 0.2), rgba(217, 119, 70, 0.25))',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 20,
          border: '1px solid rgba(233, 196, 106, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e9c46a, #d4a373)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            boxShadow: '0 4px 14px rgba(233, 196, 106, 0.4)',
            marginBottom: 4
          }}>
            🌅
          </div>

          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            Day {summary.day} Completed!
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1' }}>
            The stars set over Tuscany. Here is how your pizzeria performed today:
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 20
        }}>
          {/* Revenue */}
          <div className="glass-panel" style={{ padding: '14px', borderRadius: 12, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
              <Coins size={14} color="#ffd166" />
              <span>Gross Earnings</span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4ade80' }}>
              +🪙 {summary.coinsEarned.toFixed(1)}
            </div>
          </div>

          {/* Expenses */}
          <div className="glass-panel" style={{ padding: '14px', borderRadius: 12, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
              <Coins size={14} color="#f87171" />
              <span>Expenses & Wages</span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171' }}>
              -🪙 {summary.coinsSpent.toFixed(1)}
            </div>
          </div>

          {/* Net Profit */}
          <div className="glass-panel" style={{
            gridColumn: '1 / -1',
            padding: '14px 18px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: netProfit >= 0 ? 'rgba(74, 222, 128, 0.08)' : 'rgba(248, 113, 113, 0.08)',
            border: netProfit >= 0 ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(248, 113, 113, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {netProfit >= 0 ? <TrendingUp size={24} color="#4ade80" /> : <TrendingDown size={24} color="#f87171" />}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Net Daily Profit</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Earnings minus seed costs & staff payroll</div>
              </div>
            </div>

            <div style={{
              fontWeight: 900,
              fontSize: '1.4rem',
              color: netProfit >= 0 ? '#4ade80' : '#f87171'
            }}>
              {netProfit >= 0 ? `+🪙 ${netProfit.toFixed(1)}` : `-🪙 ${Math.abs(netProfit).toFixed(1)}`}
            </div>
          </div>

          {/* Kitchen stats */}
          <div className="glass-panel" style={{ padding: 12, borderRadius: 12, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
              <Utensils size={14} color="#f4a261" />
              <span>Dishes Served</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {summary.dishesServed} Orders
            </div>
            <div style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: 2 }}>
              {summary.perfectBakes} perfect golden crusts
            </div>
          </div>

          {/* Farm stats */}
          <div className="glass-panel" style={{ padding: 12, borderRadius: 12, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
              <Sprout size={14} color="#4ade80" />
              <span>Garden Harvest</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {summary.cropsHarvested} Produce
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: 2 }}>
              Star dish: {summary.bestDish}
            </div>
          </div>
        </div>

        {/* Reputation & Challenges footer badges */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={16} fill="#ffb703" color="#ffb703" />
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Reputation:</span>
            <strong style={{ color: summary.reputationChange >= 0 ? '#4ade80' : '#f87171' }}>
              {summary.reputationChange >= 0 ? `+${summary.reputationChange}` : summary.reputationChange} ⭐
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={16} color="#60a5fa" />
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Objectives:</span>
            <strong style={{ color: '#fff' }}>
              {summary.challengesCompleted} Done
            </strong>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleContinue}
          className="btn-primary"
          style={{
            padding: '14px 28px',
            borderRadius: 30,
            fontSize: '1.05rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer'
          }}
        >
          <span>Begin Day {summary.day + 1}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
