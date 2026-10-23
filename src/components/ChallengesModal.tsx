import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Clock, Coins, Award, X } from 'lucide-react';
import { gameStore } from '../engine/GameStore';
import type { DailyChallenge } from '../types/game';

export const ChallengesModal: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return gameStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const challenges = gameStore.dailyChallenges;
  const day = gameStore.day;
  const secondsLeft = Math.max(0, 720 - gameStore.timeOfDaySeconds);
  const minutesLeft = Math.floor(secondsLeft / 60);
  const secsLeft = Math.floor(secondsLeft % 60);

  const completedCount = challenges.filter(c => c.completed).length;

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div 
        className="modal-panel glass-panel" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 640, width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #e9c46a, #d4a373)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={24} color="#1f2421" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                Daily Objectives — Day {day}
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Complete daily goals to earn bonus gold coins and culinary experience.
              </p>
            </div>
          </div>

          <button 
            className="glass-button" 
            onClick={() => gameStore.closeModal()}
            style={{ width: 36, height: 36, padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Day timer banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: '10px 16px',
          marginBottom: 16,
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#cbd5e1' }}>
            <Clock size={16} color="#60a5fa" />
            <span>Time Until Next Dawn:</span>
            <strong style={{ color: '#fff', fontFamily: 'monospace' }}>
              {minutesLeft}m {secsLeft.toString().padStart(2, '0')}s
            </strong>
          </div>

          <div style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: completedCount === challenges.length ? '#4ade80' : '#ffd166',
            background: 'rgba(0,0,0,0.3)',
            padding: '3px 10px',
            borderRadius: 12
          }}>
            {completedCount} / {challenges.length} Finished
          </div>
        </div>

        {/* Challenges list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          {challenges.map((c: DailyChallenge) => {
            const pct = Math.min(100, Math.round((c.progress / c.target) * 100));

            return (
              <div
                key={c.id}
                className="glass-panel"
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: c.completed ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: c.completed ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}>
                      {c.icon}
                    </div>

                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.title}
                        {c.completed && (
                          <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                        {c.description}
                      </div>
                    </div>
                  </div>

                  {/* Rewards tag */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(233, 196, 106, 0.15)',
                      padding: '4px 8px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#ffd166'
                    }}>
                      <Coins size={14} />
                      +{c.rewardCoins}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(42, 157, 143, 0.15)',
                      padding: '4px 8px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#4ade80'
                    }}>
                      <Award size={14} />
                      +{c.rewardXp} XP
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: 4 }}>
                    <span>Progress</span>
                    <span style={{ fontWeight: 700 }}>{c.progress} / {c.target}</span>
                  </div>

                  <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: c.completed ? 'linear-gradient(90deg, #4ade80, #22c55e)' : 'linear-gradient(90deg, #d97746, #e9c46a)',
                      borderRadius: 4,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
