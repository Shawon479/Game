import React, { useEffect, useState } from 'react';
import { gameStore } from '../engine/GameStore';
import type { HighScore } from '../types/game';

const TIER_NAMES: Record<number, string> = {
  1: '🍕 Rustic Bistro',
  2: '🍷 Trattoria di Toscana',
  3: '🏛️ Grand Villa Pizzeria',
};

const MEDAL = ['🥇', '🥈', '🥉'];

export const LeaderboardModal: React.FC = () => {
  const [scores, setScores] = useState<HighScore[]>([...gameStore.highScores]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsub = gameStore.subscribe(() => {
      setScores([...gameStore.highScores]);
    });
    return unsub;
  }, []);

  const handleSubmit = () => {
    gameStore.submitHighScore();
    setSubmitted(true);
  };

  const handleClose = () => gameStore.closeModal();

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={{
        background: 'linear-gradient(160deg, #0d0d1a, #1a1a2e)',
        border: '1px solid rgba(255,200,80,0.2)',
        borderRadius: '22px',
        padding: '30px',
        width: '90%',
        maxWidth: '520px',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 24px 70px rgba(0,0,0,0.7), 0 0 50px rgba(255,200,50,0.04)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 900,
              color: '#ffc857',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.5px',
            }}>🏆 Hall of Fame</h2>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px', fontFamily: "'Inter', sans-serif" }}>
              Top 10 all-time runs on this device
            </p>
          </div>
          <button onClick={handleClose} style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            color: '#ccc',
            fontSize: '16px',
          }}>✕</button>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitted}
          style={{
            width: '100%',
            padding: '12px',
            background: submitted
              ? 'rgba(42,157,143,0.2)'
              : 'linear-gradient(135deg, #ffc857, #e09f3e)',
            border: 'none',
            borderRadius: '12px',
            color: submitted ? '#2a9d8f' : '#1a1a2e',
            fontSize: '14px',
            fontWeight: 800,
            fontFamily: "'Inter', sans-serif",
            cursor: submitted ? 'default' : 'pointer',
            marginBottom: '20px',
            transition: 'all 0.2s',
          }}
        >
          {submitted ? '✅ Score Submitted!' : '📤 Submit Current Run'}
        </button>

        <button
          onClick={() => gameStore.openModal('piazza')}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'rgba(199,125,255,0.09)',
            border: '1px solid rgba(199,125,255,0.25)',
            borderRadius: '11px',
            color: '#e9d5ff',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
          }}
        >
          📮 Piazza Post · AI review &amp; café postcards
        </button>

        {/* Score list */}
        {scores.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#555',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🍕</div>
            No runs submitted yet!<br />
            <span style={{ color: '#444', fontSize: '12px' }}>Submit your first run to start the leaderboard.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {scores.map((score, idx) => (
              <div key={score.timestamp} style={{
                background: idx === 0
                  ? 'linear-gradient(135deg, rgba(255,200,80,0.12), rgba(255,200,80,0.04))'
                  : 'rgba(255,255,255,0.03)',
                border: idx === 0
                  ? '1px solid rgba(255,200,80,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                {/* Rank */}
                <div style={{
                  fontSize: idx < 3 ? '22px' : '14px',
                  fontWeight: 800,
                  color: idx >= 3 ? '#555' : undefined,
                  minWidth: '28px',
                  textAlign: 'center',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {idx < 3 ? MEDAL[idx] : `#${idx + 1}`}
                </div>

                {/* Info block */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#e0e0e0',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    Day {score.day} · {TIER_NAMES[score.restaurantTier] || 'Bistro'}
                  </div>
                  <div style={{
                    color: '#888',
                    fontSize: '11px',
                    fontFamily: "'Inter', sans-serif",
                    marginTop: '2px',
                  }}>
                    {score.dishesServed} dishes · ⭐ {score.reputationStars.toFixed(1)} rep · {formatDate(score.timestamp)}
                  </div>
                </div>

                {/* Coins */}
                <div style={{
                  color: '#ffc857',
                  fontSize: '15px',
                  fontWeight: 800,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  🪙 {score.coinsEarned.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: '20px',
          color: '#444',
          fontSize: '11px',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
        }}>
          Scores are sorted by total coins earned
        </div>
      </div>
    </div>
  );
};
